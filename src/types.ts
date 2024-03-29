import { DodgeballLogLevel } from "./logger";

export enum DodgeballApiVersion {
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
  apiVersion: DodgeballApiVersion;
  apiUrl?: string; // For completely isolated (self-hosted) distributions, you will need to supply a URL to the API.
  logLevel?: DodgeballLogLevel;
  isEnabled?: boolean;
}

export interface ICheckpointEvent {
  ip: string;
  data: { [key: string]: any };
}

export interface ITrackEvent {
  type: string; // The name of the event, may be any string under 256 characters, that indicates what took place
  data: { [key: string]: any }; // Any arbitrary data they want to track. Will be digested into the Dodgeball Vocabulary
  eventTime?: number; // ms since Epoch
}

export interface ITrackOptions {
  event: ITrackEvent;
  sessionId?: string;
  userId?: string;
  sourceToken?: string;
}

export interface ICheckpointResponseOptions {
  sync?: boolean;
  timeout?: number;
  webhook?: {
    url: string;
  };
}

export interface ICheckpointOptions {
  checkpointName: string;
  event: ICheckpointEvent;
  sourceToken?: string;
  sessionId?: string;
  userId?: string;
  useVerificationId?: string;
  options?: ICheckpointResponseOptions;
}

export interface IDodgeballVerification {
  id: string;
  status: VerificationStatus;
  outcome: VerificationOutcome;
}

export interface IDodgeballCheckpointResponse {
  success: boolean;
  errors: IDodgeballApiError[];
  version: DodgeballApiVersion;
  verification?: IDodgeballVerification;
  isTimeout?: boolean;
}

// Error Types
export interface IDodgeballApiError {
  code: number;
  message: string;
}

export class DodgeballMissingConfigError extends Error {
  constructor(configName: string, value: any) {
    super(
      `Dodgeball SDK Error\nMissing configuration: ${configName}\nProvided Value: ${value}`
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DodgeballInvalidConfigError extends Error {
  constructor(configName: string, value: any, allowedValues: any[]) {
    super(
      `Dodgeball SDK Error\nInvalid configuration: ${configName}\nProvided value: ${value}\nAllowed values: ${allowedValues.join(
        ", "
      )}`
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DodgeballMissingParameterError extends Error {
  constructor(parameter: string, value: any) {
    super(
      `Dodgeball SDK Error\nMissing parameter: ${parameter}\nProvided value: ${value}`
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
