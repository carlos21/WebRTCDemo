import ResponseStatus from "./ResponseStatus";

export default interface ErrorResponse {
  status: ResponseStatus;
  data?: any;
}