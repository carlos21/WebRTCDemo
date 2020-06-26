import Config from "./Config";

const serverURI = process.env.REACT_APP_SIGNALING_SERVER_URI as string;
const rtcConfig: RTCConfiguration = {
  iceServers: [
    // { 
    //   'urls': 'stun:stun.carlosduclos.dev:5349',
    //   'username': 'guest',
    //   'credential': 'somepassword'
    // },
    { 'urls': 'stun:stun.l.google.com:19302' },
    { 'urls': 'stun:stun.services.mozilla.com' }
  ],
  //iceTransportPolicy: 'relay' // force pass through turn server
}

const config: Config = {
  uri: serverURI,
  rtcConfig: rtcConfig,
  streamConstraints: {
    audio: true,
    video: true
  },
  isCaller: true,
  socketPath: process.env.REACT_APP_SOCKET_PATH as string
}

const streamConstraints = {
  audio: true,
  video: true
};

export { config, rtcConfig, serverURI, streamConstraints };