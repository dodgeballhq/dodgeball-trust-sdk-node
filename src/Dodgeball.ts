import {
  ApiVersion,
  IDodgeballConfig,
  IDodgeballCheckpointResponse,
  ICheckpointOptions,
  ICheckpointResponseOptions,
  VerificationOutcome,
  VerificationStatus,
  DodgeballMissingParameterError,
  DodgeballMissingConfigError,
  DodgeballInvalidConfigError,
} from "./types";

import { Logger, LogLevel, Severity } from "./logger";
import {
  constructApiHeaders,
  constructApiUrl,
  makeRequest,
  sleep,
} from "./utilities";
import { DEFAULT_CONFIG, BASE_CHECKPOINT_TIMEOUT_MS } from "./constants";

import cloneDeep from "lodash.clonedeep";

// Export a class that accepts a config object
export class Dodgeball {
  secretKey: string;
  config: IDodgeballConfig;

  // Constructor
  constructor(secretKey: string, config?: IDodgeballConfig) {
    if (secretKey == null || secretKey?.length === 0) {
      throw new DodgeballMissingConfigError("secretApiKey", secretKey);
    }
    this.secretKey = secretKey;

    this.config = Object.assign(
      cloneDeep(DEFAULT_CONFIG),
      cloneDeep(config || {})
    );

    if (
      Object.keys(ApiVersion).indexOf(this.config.apiVersion as ApiVersion) < 0
    ) {
      throw new DodgeballInvalidConfigError(
        "config.apiVersion",
        this.config.apiVersion,
        Object.keys(ApiVersion)
      );
    }

    const logLevel = this.config.logLevel ?? LogLevel.INFO;

    if (Object.keys(LogLevel).indexOf(logLevel as LogLevel) < 0) {
      throw new DodgeballInvalidConfigError(
        "config.logLevel",
        logLevel,
        Object.keys(LogLevel)
      );
    }

    Logger.filterLevel = Severity[logLevel];
  }

  createErrorResponse(code: number, message: string) {
    return {
      success: false,
      errors: [{ code: code, message: message }],
      version: ApiVersion.v1,
      verification: {
        id: "",
        status: VerificationStatus.FAILED,
        outcome: VerificationOutcome.ERROR,
      },
    };
  }

  public async checkpoint({
    checkpointName,
    event,
    dodgeballId,
    userId = "",
    useVerificationId = "",
    options = {},
  }: ICheckpointOptions): Promise<IDodgeballCheckpointResponse> {
    let trivialTimeout = !options.timeout || options.timeout <= 0;
    let largeTimeout =
      options.timeout && options.timeout > 5 * BASE_CHECKPOINT_TIMEOUT_MS;
    let mustPoll = trivialTimeout || largeTimeout;
    let activeTimeout = mustPoll
      ? BASE_CHECKPOINT_TIMEOUT_MS
      : options.timeout ?? BASE_CHECKPOINT_TIMEOUT_MS;

    let maximalTimeout = 1000;

    let internalOptions: ICheckpointResponseOptions = {
      sync:
        options.sync === null || options.sync === undefined
          ? true
          : options.sync,
      timeout: activeTimeout,
      webhook: options.webhook,
    };

    let response: IDodgeballCheckpointResponse | null = null;
    let numRepeats = 0;
    let numFailures = 0;

    // Validate required parameters are present
    if (checkpointName == null) {
      throw new DodgeballMissingParameterError(
        "checkpointName",
        checkpointName
      );
    }

    if (event == null) {
      throw new DodgeballMissingParameterError("event", event);
    } else if (!event.hasOwnProperty("ip")) {
      throw new DodgeballMissingParameterError("event.ip", event.ip);
    }

    if (dodgeballId == null) {
      throw new DodgeballMissingParameterError("dodgeballId", dodgeballId);
    }

    while (!response && numRepeats < 3) {
      response = (await makeRequest({
        url: `${constructApiUrl(
          this.config.apiUrl as string,
          this.config.apiVersion
        )}verify`,
        method: "POST",
        headers: constructApiHeaders(
          this.secretKey,
          useVerificationId,
          dodgeballId,
          userId
        ),
        data: {
          event: {
            type: checkpointName,
            ...event,
          },
          options: internalOptions,
        },
        options: {},
      })) as IDodgeballCheckpointResponse;

      numRepeats += 1;
    }

    if (!response) {
      return this.createErrorResponse(500, "Unknown evaluation error");
    } else if (!response.success) {
      return response;
    }

    let isResolved =
      response.verification.status !== VerificationStatus.PENDING;
    let verificationId = response.verification.id;

    // @ts-ignore
    while (
      (trivialTimeout ||
        (options?.timeout ?? BASE_CHECKPOINT_TIMEOUT_MS) >
          numRepeats * activeTimeout) &&
      !isResolved &&
      numFailures < 3
    ) {
      await sleep(activeTimeout);
      activeTimeout =
        activeTimeout < maximalTimeout ? 2 * activeTimeout : activeTimeout;

      response = (await makeRequest({
        url: `${constructApiUrl(
          this.config.apiUrl as string,
          this.config.apiVersion
        )}verification/${verificationId}`,
        method: "GET",
        headers: constructApiHeaders(
          this.secretKey,
          useVerificationId,
          dodgeballId,
          userId
        ),
      })) as IDodgeballCheckpointResponse;

      if (response && response.success) {
        let status = response.verification?.status;
        if (!status) {
          numFailures += 1;
        } else {
          isResolved = status !== VerificationStatus.PENDING;
          numRepeats += 1;
        }
      } else {
        numFailures += 1;
      }
    }

    Logger.trace("Returning response:", { response: response }).log();
    return response as IDodgeballCheckpointResponse;
  }

  public isRunning(checkpointResponse: IDodgeballCheckpointResponse): boolean {
    if (checkpointResponse.success) {
      switch (checkpointResponse.verification.status) {
        case VerificationStatus.PENDING:
        case VerificationStatus.BLOCKED:
          return true;
        default:
          return false;
      }
    }

    return false;
  }

  public isAllowed(checkpointResponse: IDodgeballCheckpointResponse): boolean {
    return (
      checkpointResponse.success &&
      checkpointResponse.verification?.status === VerificationStatus.COMPLETE &&
      checkpointResponse.verification?.outcome === VerificationOutcome.APPROVED
    );
  }

  public isDenied(checkpointResponse: IDodgeballCheckpointResponse): boolean {
    if (checkpointResponse.success) {
      switch (checkpointResponse.verification.outcome) {
        case VerificationOutcome.DENIED:
          return true;
        default:
          return false;
      }
    }

    return false;
  }

  public isUndecided(
    checkpointResponse: IDodgeballCheckpointResponse
  ): boolean {
    return (
      checkpointResponse.success &&
      checkpointResponse.verification?.status === VerificationStatus.COMPLETE &&
      checkpointResponse.verification?.outcome === VerificationOutcome.PENDING
    );
  }

  public hasError(checkpointResponse: IDodgeballCheckpointResponse): boolean {
    return (
      !checkpointResponse.success &&
      ((checkpointResponse.verification?.status === VerificationStatus.FAILED &&
        checkpointResponse.verification?.outcome ===
          VerificationOutcome.ERROR) ||
        checkpointResponse.errors?.length > 0)
    );
  }
}
