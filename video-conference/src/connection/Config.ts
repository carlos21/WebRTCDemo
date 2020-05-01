import StreamConstraints from "./StreamConstraints";

export default interface Config {
  uri: string;
  roomId: string;
  rtcConfig: RTCConfiguration;
  streamConstraints: StreamConstraints;
  isCaller: boolean;
}