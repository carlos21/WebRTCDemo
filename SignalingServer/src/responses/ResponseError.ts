import ResponseStatus from "./ResponseStatus";

export default class ResponseError implements Error {
  name: string;
  message: string;
  data: any;

  constructor(message: string = "", data?: any) {
    this.name = "";
    this.message = message;
    this.data = data;
  }
}