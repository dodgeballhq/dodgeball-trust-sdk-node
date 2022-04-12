import axios, { Method } from "axios";

interface IRequestParams {
  url: string;
  method: Method;
  headers: any;
  data: any;
}

// function to wrap axios requests
export const makeRequest = async ({ url, method, headers, data }: IRequestParams): Promise<any> => {
  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
      timeout: data?.timeout ?? 0
    });
    return response.data;
  } catch (error) {
    console.log(error);
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
}

// function to construct api request headers
export const constructApiHeaders = (
  token: string,
  verificationId = "",
  sourceId = "",
  customSourceId = ""
) => {
  let headers: { [key: string]: string } = {
    "Dodgeball-Secret-Key": `${token}`,
  };

  if (verificationId) {
    headers["Dodgeball-Verification-Id"] = `${verificationId}`;
  }

  if (sourceId) {
    headers["Dodgeball-Source-Id"] = sourceId;
  }

  if (customSourceId) {
    headers["Dodgeball-Custom-Source-Id"] = customSourceId;
  }

  return headers;
};
