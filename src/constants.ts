import { DodgeballLogLevel } from "./logger";
import { DodgeballApiVersion, IDodgeballConfig } from "./types";

export const DEFAULT_CONFIG: IDodgeballConfig = {
  apiVersion: DodgeballApiVersion.v1,
  apiUrl: "https://api.dodgeballhq.com/",
  logLevel: DodgeballLogLevel.TRACE,
  isEnabled: true,
};

export const BASE_CHECKPOINT_TIMEOUT_MS = 100;
export const MAX_TIMEOUT = 10000;
export const MAX_RETRY_COUNT = 3;
