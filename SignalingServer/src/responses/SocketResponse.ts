import ResponseStatus from "./ResponseStatus";
import ResponseError from "./ResponseError";

export default class SocketResponse {
  
  static build = (status: ResponseStatus, message: string = "", data?: any): Object => {
    return {
      status: status,
      message: message,
      data: data
    }
  }

  static buildError = (message: string = "", data?: ResponseData): ResponseError => {
    return new ResponseError(message, data);
  }
}

interface ResponseData {
  status: ResponseStatus;
  data?: any;
}