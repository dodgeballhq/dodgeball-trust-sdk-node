import { LogLevel } from "./logger";

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
  apiUrl?: string; // For completely isolated (self-hosted) distributions, you will need to supply a URL to the API.
  logLevel?: LogLevel;
}

export interface IEvent {
  ip: string;
  data: { [key: string]: any };
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
  event: IEvent;
  dodgeballId: string;
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
  version: ApiVersion;
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
