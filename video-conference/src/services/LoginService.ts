import { serverURI } from '../connection/Constants';

export type LoginUserResultHandler = (response: TokenResponse) => void;
export type ErrorHandler = (error: Error) => void;

export interface TokenResponse {
  token: string;
}

export default class LoginService {

  private loginUrl = `${serverURI}/api/authorize`;

  login = (username: string, resultHandler: LoginUserResultHandler, errorHandler: ErrorHandler) => {
    const params = {
      username: username
    }
    const request: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    }
    fetch(this.loginUrl, request)
      .then((response) => response.json())
      .then(json => {
        console.log("JSON RESPONSE", json);
        resultHandler(json as TokenResponse);
      })
      .catch(error => {
        console.log("RESPONSE ERROR", error);
        errorHandler(error);
      });
  }
}