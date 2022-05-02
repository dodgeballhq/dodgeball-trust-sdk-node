import {
  ApiVersion,
  IDodgeballConfig,
  IDodgeballIdentifyResponse,
  IDodgeballTrackResponse,
  IDodgeballVerifyResponse,
  ITrackOptions,
  IVerifyOptions,
  IVerifyResponseOptions,
  VerificationOutcome,
  VerificationStatus,
} from "./types";

import { Logger } from "./logger"
import {constructApiHeaders, constructApiUrl, makeRequest, sleep} from "./utilities";

const DEFAULT_CONFIG: IDodgeballConfig = {
  apiVersion: ApiVersion.v1,
  apiUrl: "https://api.dodgeballhq.com/",
};

const BASE_VERIFY_TIMEOUT_MS = 100

// Export a class that accepts a config object
export class Dodgeball {
  secretKey: string;
  config: IDodgeballConfig;

  // Constructor
  constructor(secretKey: string, config?: IDodgeballConfig) {
    this.secretKey = secretKey;
    this.config = Object.assign(DEFAULT_CONFIG, config || {});
  }

  public async identify(
    data: any,
    customSourceId?: string
  ): Promise<IDodgeballIdentifyResponse> {
    // Send the data along to the identify endpoint
    const response = (await makeRequest({
      url: `${constructApiUrl(
        this.config.apiUrl as string,
        this.config.apiVersion
      )}identify`,
      method: "POST",
      headers: constructApiHeaders(this.secretKey, "", "", customSourceId),
      data: data,
    })) as IDodgeballIdentifyResponse;

    return response;
  }

  public async track({
    event,
    dodgeballId,
  }: ITrackOptions): Promise<IDodgeballTrackResponse> {
    // Send the event, expecting just an acknowledgement response
    const response = (await makeRequest({
      url: `${constructApiUrl(
        this.config.apiUrl as string,
        this.config.apiVersion
      )}track`,
      method: "POST",
      headers: constructApiHeaders(this.secretKey, "", dodgeballId),
      data: {
        event: event,
      },
    })) as IDodgeballTrackResponse;

    return response;
  }

  createErrorResponse(code: number, message: string){
    return {
      success: false,
      errors: [{code: code, message: message}],
      version: ApiVersion.v1,
      verification: {
        id: "",
        status: VerificationStatus.FAILED,
        outcome: VerificationOutcome.ERROR
      }
    }
  }

  public async verify({
    workflow,
    dodgeballId,
    useVerification,
    options,
  }: IVerifyOptions): Promise<IDodgeballVerifyResponse> {

    let trivialTimeout = !options.timeout || options.timeout <= 0;
    let largeTimeout = options.timeout && options.timeout > 5*BASE_VERIFY_TIMEOUT_MS
    let mustPoll = trivialTimeout || largeTimeout
    let activeTimeout = mustPoll ?
        BASE_VERIFY_TIMEOUT_MS :
        options.timeout ?? BASE_VERIFY_TIMEOUT_MS

    let maximalTimeout = 1000

    let internalOptions: IVerifyResponseOptions = {
      sync: false,
      timeout: activeTimeout,
      webhook: options.webhook
    }

    let response: IDodgeballVerifyResponse | null = null
    let numRepeats = 0
    let numFailures = 0

    while(!response && numRepeats < 3) {
      response = (await makeRequest({
        url: `${constructApiUrl(
            this.config.apiUrl as string,
            this.config.apiVersion
        )}verify`,
        method: "POST",
        headers: constructApiHeaders(
            this.secretKey,
            useVerification?.id,
            dodgeballId
        ),
        data: {
          event: workflow,
          options: internalOptions,
        },
      options: {}
      })) as IDodgeballVerifyResponse;

      numRepeats += 1
    }

    if(!response) {
      return this.createErrorResponse(500, "Unknown evaluation error")
    } else if(!response.success){
      return response
    }

    let isResolved = response.verification.status !== VerificationStatus.PENDING
    let verificationId = response.verification.id

    // @ts-ignore
    while((trivialTimeout || options?.timeout > numRepeats*activeTimeout) &&
      !isResolved &&
        numFailures < 3) {

      await sleep(activeTimeout)
      activeTimeout = activeTimeout < maximalTimeout ? 2*activeTimeout : activeTimeout

      response = await makeRequest({
        url: `${constructApiUrl(
            this.config.apiUrl as string,
            this.config.apiVersion
        )}verification/${verificationId}`,
        method: "GET",
        headers: constructApiHeaders(
            this.secretKey,
            useVerification?.id,
            dodgeballId
        ),
      }) as IDodgeballVerifyResponse;

      if(response && response.success){
        let status = response.verification?.status
        if(!status){
          numFailures += 1
        }
        else{
          isResolved = (status !== VerificationStatus.PENDING)
          numRepeats += 1
        }
      }
      else {
        numFailures += 1
      }
    }

   Logger.trace("Returning response:", {response: response}).log()
    return response as IDodgeballVerifyResponse;
  }

  public isRunning(verifyResponse: IDodgeballVerifyResponse): boolean {
    if (verifyResponse.success) {
      switch (verifyResponse.verification.status) {
        case VerificationStatus.PENDING:
        case VerificationStatus.BLOCKED:
        case VerificationStatus.REQUIRES_INPUT:
          return true;
        default:
          return false;
      }
    }

    return false;
  }

  public isAllowed(verifyResponse: IDodgeballVerifyResponse): boolean {
    return verifyResponse.success &&
        verifyResponse.verification?.status === VerificationStatus.COMPLETE &&
        verifyResponse.verification?.outcome === VerificationOutcome.APPROVED;
  }

  public isDenied(verifyResponse: IDodgeballVerifyResponse): boolean {
    if (verifyResponse.success) {
      switch (verifyResponse.verification.outcome) {
        case VerificationOutcome.DENIED:
          return true;
        default:
          return false;
      }
    }

    return false;
  }
}
