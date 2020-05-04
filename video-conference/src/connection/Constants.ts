import Config from "./Config";

const serverURI = process.env.REACT_APP_SIGNALING_SERVER_URI as string;
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { 'urls': 'stun:stun.services.mozilla.com' },
    { 'urls': 'stun:stun.l.google.com:19302' }
  ]
}

const config: Config = {
  uri: serverURI,
  rtcConfig: rtcConfig,
  streamConstraints: {
    audio: true,
    video: true
  },
  isCaller: true
}

export { config, rtcConfig, serverURI };