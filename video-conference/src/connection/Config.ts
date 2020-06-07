import StreamConstraints from "./StreamConstraints";

export default interface Config {
  uri: string;
  rtcConfig: RTCConfiguration;
  streamConstraints: StreamConstraints;
  isCaller: boolean;
  socketPath: string;
}