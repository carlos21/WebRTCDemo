import SimplePeer, { Options } from 'simple-peer';
import Config from './Config';
import ErrorResponse from '../responses/ErrorResponse';
import ErrorDataResponse from '../responses/ErrorDataResponse';

export default class Signaling {

  // Properties

  config: Config;
  token: string;
  room: string;
  peerConnection?: RTCPeerConnection;
  localStream: MediaStream;
  remoteStream?: MediaStream;

  constructor(config: Config, username: string, room: string, token: string, localStream: MediaStream, force: boolean = false) {
    this.config = config;
    this.room = room;
    this.token = token;
    this.localStream = localStream;
    this.setup();
  }

  // Methods

  setup = () => {
    const options: Options = {
      config: this.config.rtcConfig,
      stream: this.localStream
    };
    const peer = new SimplePeer(options);

    peer.on('error', error => {
      console.log('error', error);
    });

    peer.on('signal', data => {
      console.log('signal', JSON.stringify(data));
    });

    peer.on('connect', () => {
      console.log('connected');
    });

    peer.on('disconnect', () => {
      console.log('disconnect');
    });

    peer.on('data', data => {
      console.log('data: ' + data);
    });
  }
}