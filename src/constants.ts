import { LogLevel } from "./logger";
import { ApiVersion, IDodgeballConfig } from "./types";

export const DEFAULT_CONFIG: IDodgeballConfig = {
  apiVersion: ApiVersion.v1,
  apiUrl: "https://api.dodgeballhq.com/",
  logLevel: LogLevel.TRACE,
};

export const BASE_CHECKPOINT_TIMEOUT_MS = 100;
