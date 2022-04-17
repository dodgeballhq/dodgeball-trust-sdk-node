export enum ApiVersion {
  v1 = "v1",
}

export enum VerificationStatus {

  // In Process on the server
  PENDING = "PENDING",

  // Waiting on some action, for example MFA
  BLOCKED = "BLOCKED",

  // Workflow evaluated successfully
  COMPLETE = "COMPLETE",

  // Workflow execution failure
  FAILED = "FAILED",
}

export enum VerificationOutcome {
  APPROVED = "APPROVED",
  DENIED = "DENIED",
  PENDING = "PENDING",
  ERROR = "ERROR",
}

export interface IDodgeballConfig {
  apiVersion: ApiVersion;
  apiUrl?: string; // For customers with completely isolated (self-hosted) distributions, they will need to supply a URL to the API.
}

export interface IEvent {
  ip: string;
  type: string;
  data: { [key: string]: any };
}

export interface ITrackOptions {
  event: IEvent;
  dodgeballId: string;
}

export interface IVerifyResponseOptions{
  sync?: boolean;
  timeout?: number;
  webhook?: {
    url: string;
  };
}

export interface IVerifyOptions {
  workflow: IEvent;
  dodgeballId: string;
  useVerification?: {
    // This is a previous verification (workflowExecution) we want to attempt to use.
    id: string;
  };
  options: IVerifyResponseOptions;
}

export interface IDodgeballApiError {
  code: number;
  message: string;
}

export interface IDodgeballIdentifyResponse {
  id: string;
}

export interface IDodgeballTrackResponse {
  success: boolean;
  errors: IDodgeballApiError[];
  version: ApiVersion;
}

export interface IDodgeballVerifyResponse {
  success: boolean;
  errors: IDodgeballApiError[];
  version: ApiVersion;
  verification: {
    id: string;
    status: VerificationStatus;
    outcome: VerificationOutcome;
  };
}
