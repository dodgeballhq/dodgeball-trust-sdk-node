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
import {constructApiHeaders, constructApiUrl, makeRequest} from "./utilities";

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

  public async verify({
    workflow,
    dodgeballId,
    useVerification,
    options,
  }: IVerifyOptions): Promise<IDodgeballVerifyResponse> {

    let trivialTimeout = !options.timeout || options.timeout <= 0;
    let largeTimeout = options.timeout && options.timeout > 5*BASE_VERIFY_TIMEOUT_MS
    let mustPoll = trivialTimeout || largeTimeout
    let activeTimeout = mustPoll? BASE_VERIFY_TIMEOUT_MS: options.timeout

    let internalOptions: IVerifyResponseOptions = {
      sync: false,
      timeout: activeTimeout,
      webhook: options.webhook
    }

    let numRepeats = 0
    let isResolved = false
    let response: IDodgeballVerifyResponse | null = null
    let numFailures = 0

    // @ts-ignore
    while((trivialTimeout || options?.timeout > numRepeats*activeTimeout) &&
      !isResolved &&
        numFailures < 3) {
      // Verify the event, expecting an acknowledgement containing details for tracking the asynchronous response
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
          options: options,
        },
      })) as IDodgeballVerifyResponse;

      if(response && response.success){
        let status = response.verification?.status
        if(!status){
          numFailures += 1
        }
        else{
          isResolved = (status === VerificationStatus.COMPLETE) ||
              (status === VerificationStatus.FAILED)

          numRepeats += 1
        }
      }
      else{
        numFailures += 1
      }
    }

    return response as IDodgeballVerifyResponse;
  }

  public isPending(verifyResponse: IDodgeballVerifyResponse): boolean {
    if (verifyResponse.success) {
      switch (verifyResponse.verification.status) {
        case VerificationStatus.PENDING:
          return true;
        default:
          return false;
      }
    }

    return false;
  }

  public isAllowed(verifyResponse: IDodgeballVerifyResponse): boolean {
    if (verifyResponse.success) {
      // switch (verifyResponse.verification.status) {
      //   case VerificationStatus.COMPLETE:
      //     switch (verifyResponse.verification.outcome) {
      //       case VerificationOutcome.APPROVED:
      //         return true;
      //       default:
      //         return false;
      //     }
      //   default:
      //     return false;
      // }
      switch (verifyResponse.verification.outcome) {
        case VerificationOutcome.APPROVED:
          return true;
        default:
          return false;
      }
    }

    return false;
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
