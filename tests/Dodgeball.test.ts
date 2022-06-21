import { IDodgeballCheckpointResponse } from "./../dist/types/types.d";
import {
  DodgeballInvalidConfigError,
  IDodgeballVerification,
  VerificationOutcome,
  VerificationStatus,
} from "./../src/types";
import { Dodgeball } from "../src/Dodgeball";
import { DodgeballLogLevel } from "../src/logger";
import { DodgeballApiVersion, DodgeballMissingConfigError } from "../src/types";

describe("constructor", () => {
  test("should require an API key", () => {
    expect(() => {
      new Dodgeball("");
    }).toThrow(DodgeballMissingConfigError);
  });

  test("should only require an API key", () => {
    let dodgeball = new Dodgeball("test-secret-key");
    expect(dodgeball).toBeInstanceOf(Dodgeball);
  });

  test("should accept a valid config object", () => {
    let dodgeball = new Dodgeball("test-secret-key", {
      apiVersion: DodgeballApiVersion.v1,
      apiUrl: "https://api.dodgeballhq.com/",
      logLevel: DodgeballLogLevel.TRACE,
    });

    expect(dodgeball).toBeInstanceOf(Dodgeball);
  });

  test("should fail with an invalid apiVersion in config object", () => {
    expect(() => {
      new Dodgeball("test-secret-key", {
        apiVersion: "invalid" as any,
      });
    }).toThrow(DodgeballInvalidConfigError);
  });

  test("should fail with an invalid logLevel in the config object", () => {
    expect(() => {
      new Dodgeball("test-secret-key", {
        apiVersion: DodgeballApiVersion.v1,
        logLevel: "invalid" as any,
      });
    }).toThrow(DodgeballInvalidConfigError);
  });
});

describe("isRunning", () => {
  let dodgeball: Dodgeball;
  let checkpointResponse: IDodgeballCheckpointResponse;

  beforeAll(() => {
    dodgeball = new Dodgeball("test-secret-key");
  });

  beforeEach(() => {
    checkpointResponse = {
      success: true,
      errors: [],
      version: DodgeballApiVersion.v1,
      verification: {
        id: "test-verification-id",
        status: VerificationStatus.PENDING,
        outcome: VerificationOutcome.PENDING,
      },
    };
  });

  test("should return true for a pending verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.PENDING;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isRunning(checkpointResponse)).toBe(true);
  });

  test("should return true for a blocked verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.BLOCKED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isRunning(checkpointResponse)).toBe(true);
  });

  test("should return false for an approved verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.APPROVED;

    expect(dodgeball.isRunning(checkpointResponse)).toBe(false);
  });

  test("should return false for a denied verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.DENIED;

    expect(dodgeball.isRunning(checkpointResponse)).toBe(false);
  });

  test("should return false for a failed verification", () => {
    checkpointResponse.success = false;
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.FAILED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.ERROR;

    expect(dodgeball.isRunning(checkpointResponse)).toBe(false);
  });

  test("should return false for an undecided complete verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isRunning(checkpointResponse)).toBe(false);
  });

  test("should return false for a timeout", () => {
    delete checkpointResponse.verification;
    checkpointResponse.success = false;
    checkpointResponse.isTimeout = true;
    checkpointResponse.errors.push({
      code: 503,
      message: "Service Unavailable: Maximum retry count exceeded",
    });

    expect(dodgeball.isRunning(checkpointResponse)).toBe(false);
  });
});

describe("isAllowed", () => {
  let dodgeball: Dodgeball;
  let checkpointResponse: IDodgeballCheckpointResponse;

  beforeAll(() => {
    dodgeball = new Dodgeball("test-secret-key");
  });

  beforeEach(() => {
    checkpointResponse = {
      success: true,
      errors: [],
      version: DodgeballApiVersion.v1,
      verification: {
        id: "test-verification-id",
        status: VerificationStatus.PENDING,
        outcome: VerificationOutcome.PENDING,
      },
    };
  });

  test("should return false for a pending verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.PENDING;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isAllowed(checkpointResponse)).toBe(false);
  });

  test("should return false for a blocked verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.BLOCKED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isAllowed(checkpointResponse)).toBe(false);
  });

  test("should return true for an approved verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.APPROVED;

    expect(dodgeball.isAllowed(checkpointResponse)).toBe(true);
  });

  test("should return false for a denied verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.DENIED;

    expect(dodgeball.isAllowed(checkpointResponse)).toBe(false);
  });

  test("should return false for a failed verification", () => {
    checkpointResponse.success = false;
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.FAILED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.ERROR;

    expect(dodgeball.isAllowed(checkpointResponse)).toBe(false);
  });

  test("should return false for an undecided complete verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isAllowed(checkpointResponse)).toBe(false);
  });

  test("should return false for a timeout", () => {
    delete checkpointResponse.verification;
    checkpointResponse.success = false;
    checkpointResponse.isTimeout = true;
    checkpointResponse.errors.push({
      code: 503,
      message: "Service Unavailable: Maximum retry count exceeded",
    });

    expect(dodgeball.isAllowed(checkpointResponse)).toBe(false);
  });
});

describe("isDenied", () => {
  let dodgeball: Dodgeball;
  let checkpointResponse: IDodgeballCheckpointResponse;

  beforeAll(() => {
    dodgeball = new Dodgeball("test-secret-key");
  });

  beforeEach(() => {
    checkpointResponse = {
      success: true,
      errors: [],
      version: DodgeballApiVersion.v1,
      verification: {
        id: "test-verification-id",
        status: VerificationStatus.PENDING,
        outcome: VerificationOutcome.PENDING,
      },
    };
  });

  test("should return false for a pending verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.PENDING;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isDenied(checkpointResponse)).toBe(false);
  });

  test("should return false for a blocked verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.BLOCKED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isDenied(checkpointResponse)).toBe(false);
  });

  test("should return false for an approved verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.APPROVED;

    expect(dodgeball.isDenied(checkpointResponse)).toBe(false);
  });

  test("should return true for a denied verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.DENIED;

    expect(dodgeball.isDenied(checkpointResponse)).toBe(true);
  });

  test("should return false for a failed verification", () => {
    checkpointResponse.success = false;
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.FAILED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.ERROR;

    expect(dodgeball.isDenied(checkpointResponse)).toBe(false);
  });

  test("should return false for an undecided complete verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isDenied(checkpointResponse)).toBe(false);
  });

  test("should return false for a timeout", () => {
    delete checkpointResponse.verification;
    checkpointResponse.success = false;
    checkpointResponse.isTimeout = true;
    checkpointResponse.errors.push({
      code: 503,
      message: "Service Unavailable: Maximum retry count exceeded",
    });

    expect(dodgeball.isDenied(checkpointResponse)).toBe(false);
  });
});

describe("isUndecided", () => {
  let dodgeball: Dodgeball;
  let checkpointResponse: IDodgeballCheckpointResponse;

  beforeAll(() => {
    dodgeball = new Dodgeball("test-secret-key");
  });

  beforeEach(() => {
    checkpointResponse = {
      success: true,
      errors: [],
      version: DodgeballApiVersion.v1,
      verification: {
        id: "test-verification-id",
        status: VerificationStatus.PENDING,
        outcome: VerificationOutcome.PENDING,
      },
    };
  });

  test("should return false for a pending verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.PENDING;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isUndecided(checkpointResponse)).toBe(false);
  });

  test("should return false for a blocked verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.BLOCKED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isUndecided(checkpointResponse)).toBe(false);
  });

  test("should return false for an approved verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.APPROVED;

    expect(dodgeball.isUndecided(checkpointResponse)).toBe(false);
  });

  test("should return false for a denied verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.DENIED;

    expect(dodgeball.isUndecided(checkpointResponse)).toBe(false);
  });

  test("should return false for a failed verification", () => {
    checkpointResponse.success = false;
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.FAILED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.ERROR;

    expect(dodgeball.isUndecided(checkpointResponse)).toBe(false);
  });

  test("should return true for an undecided complete verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isUndecided(checkpointResponse)).toBe(true);
  });

  test("should return false for a timeout", () => {
    delete checkpointResponse.verification;
    checkpointResponse.success = false;
    checkpointResponse.isTimeout = true;
    checkpointResponse.errors.push({
      code: 503,
      message: "Service Unavailable: Maximum retry count exceeded",
    });

    expect(dodgeball.isUndecided(checkpointResponse)).toBe(false);
  });
});

describe("hasError", () => {
  let dodgeball: Dodgeball;
  let checkpointResponse: IDodgeballCheckpointResponse;

  beforeAll(() => {
    dodgeball = new Dodgeball("test-secret-key");
  });

  beforeEach(() => {
    checkpointResponse = {
      success: true,
      errors: [],
      version: DodgeballApiVersion.v1,
      verification: {
        id: "test-verification-id",
        status: VerificationStatus.PENDING,
        outcome: VerificationOutcome.PENDING,
      },
    };
  });

  test("should return false for a pending verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.PENDING;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.hasError(checkpointResponse)).toBe(false);
  });

  test("should return false for a blocked verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.BLOCKED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.hasError(checkpointResponse)).toBe(false);
  });

  test("should return false for an approved verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.APPROVED;

    expect(dodgeball.hasError(checkpointResponse)).toBe(false);
  });

  test("should return false for a denied verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.DENIED;

    expect(dodgeball.hasError(checkpointResponse)).toBe(false);
  });

  test("should return true for a failed verification", () => {
    checkpointResponse.success = false;
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.FAILED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.ERROR;

    expect(dodgeball.hasError(checkpointResponse)).toBe(true);
  });

  test("should return false for an undecided complete verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.hasError(checkpointResponse)).toBe(false);
  });

  test("should return true for a timeout", () => {
    delete checkpointResponse.verification;
    checkpointResponse.success = false;
    checkpointResponse.isTimeout = true;
    checkpointResponse.errors.push({
      code: 503,
      message: "Service Unavailable: Maximum retry count exceeded",
    });

    expect(dodgeball.hasError(checkpointResponse)).toBe(true);
  });
});

describe("isTimeout", () => {
  let dodgeball: Dodgeball;
  let checkpointResponse: IDodgeballCheckpointResponse;

  beforeAll(() => {
    dodgeball = new Dodgeball("test-secret-key");
  });

  beforeEach(() => {
    checkpointResponse = {
      success: true,
      errors: [],
      version: DodgeballApiVersion.v1,
      verification: {
        id: "test-verification-id",
        status: VerificationStatus.PENDING,
        outcome: VerificationOutcome.PENDING,
      },
    };
  });

  test("should return false for a pending verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.PENDING;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isTimeout(checkpointResponse)).toBeFalsy();
  });

  test("should return false for a blocked verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.BLOCKED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isTimeout(checkpointResponse)).toBeFalsy();
  });

  test("should return false for an approved verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.APPROVED;

    expect(dodgeball.isTimeout(checkpointResponse)).toBeFalsy();
  });

  test("should return false for a denied verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.DENIED;

    expect(dodgeball.isTimeout(checkpointResponse)).toBeFalsy();
  });

  test("should return false for a failed verification", () => {
    checkpointResponse.success = false;
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.FAILED;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.ERROR;

    expect(dodgeball.isTimeout(checkpointResponse)).toBeFalsy();
  });

  test("should return false for an undecided complete verification", () => {
    (checkpointResponse.verification as IDodgeballVerification).status =
      VerificationStatus.COMPLETE;
    (checkpointResponse.verification as IDodgeballVerification).outcome =
      VerificationOutcome.PENDING;

    expect(dodgeball.isTimeout(checkpointResponse)).toBeFalsy();
  });

  test("should return true for a timeout", () => {
    delete checkpointResponse.verification;
    checkpointResponse.success = false;
    checkpointResponse.isTimeout = true;
    checkpointResponse.errors.push({
      code: 503,
      message: "Service Unavailable: Maximum retry count exceeded",
    });

    expect(dodgeball.isTimeout(checkpointResponse)).toBe(true);
  });
});
