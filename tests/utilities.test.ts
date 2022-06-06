import { constructApiUrl, constructApiHeaders } from "../src/utilities";

describe("constructApiUrl", () => {
  test("should return a properly formatted url", () => {
    const url1 = constructApiUrl("https://api.dodgeballhq.com/", "v1");
    const url2 = constructApiUrl("https://api.dodgeballhq.com", "v1");

    expect(url1).toBe("https://api.dodgeballhq.com/v1/");
    expect(url2).toBe("https://api.dodgeballhq.com/v1/");
  });
});

describe("constructApiHeaders", () => {
  test("should return valid headers when only a token is supplied", () => {
    const headers = constructApiHeaders("test-secret-key");
    expect(headers).toEqual({
      "Dodgeball-Secret-Key": "test-secret-key",
    });
  });

  test("should return valid headers when a token and verification are supplied", () => {
    const headers = constructApiHeaders(
      "test-secret-key",
      "test-verification-id"
    );
    expect(headers).toEqual({
      "Dodgeball-Secret-Key": "test-secret-key",
      "Dodgeball-Verification-Id": "test-verification-id",
    });
  });

  test("should return valid headers when a token and source are supplied", () => {
    const headers = constructApiHeaders(
      "test-secret-key",
      "",
      "test-source-id"
    );
    expect(headers).toEqual({
      "Dodgeball-Secret-Key": "test-secret-key",
      "Dodgeball-Source-Id": "test-source-id",
    });
  });

  test("should return valid headers when a token and customer are supplied", () => {
    const headers = constructApiHeaders(
      "test-secret-key",
      "",
      "",
      "test-customer-id"
    );
    expect(headers).toEqual({
      "Dodgeball-Secret-Key": "test-secret-key",
      "Dodgeball-Customer-Id": "test-customer-id",
    });
  });
});
