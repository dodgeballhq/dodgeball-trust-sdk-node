import axios, { Method } from "axios";

import { Logger } from "./logger";

interface IRequestParams {
  url: string;
  method: Method;
  headers: any;
  data?: any;
  options?: any;
}

// function to wrap axios requests
export const makeRequest = async ({
  url,
  method,
  headers,
  data,
  options,
}: IRequestParams): Promise<any> => {
  try {
    // Allows for separate timeout enforcement at the DB Server vs Axios layer
    let timeout = options ? options.timeout ?? 0 : data?.timeout ?? 0;

    const response = await axios({
      method,
      url,
      headers,
      data,
      timeout: timeout,
    });
    return response.data;
  } catch (error) {
    Logger.error("makeRequest", error).log();
    return error;
  }
};

// function to construct an apiUrl with version appended to the end
export const constructApiUrl = (url: string, version: string) => {
  // ensure that the url ends with a '/'
  if (url.charAt(url.length - 1) !== "/") {
    url += "/";
  }

  return `${url}${version}/`;
};

// function to construct api request headers
export const constructApiHeaders = (
  token: string,
  verificationId = "",
  sourceToken = "",
  customerId = "",
  sessionId = ""
) => {
  let headers: { [key: string]: string } = {
    "Dodgeball-Secret-Key": `${token}`,
  };

  if (
    verificationId &&
    verificationId !== "null" &&
    verificationId !== "undefined"
  ) {
    headers["Dodgeball-Verification-Id"] = `${verificationId}`;
  }

  if (sourceToken) {
    headers["Dodgeball-Source-Token"] = sourceToken;
  }

  if (customerId) {
    headers["Dodgeball-Customer-Id"] = customerId;
  }

  if (sessionId) {
    headers["Dodgeball-Session-Id"] = sessionId;
  }

  return headers;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
