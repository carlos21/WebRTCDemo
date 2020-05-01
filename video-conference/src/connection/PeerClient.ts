import io from 'socket.io-client';
import SocketEvent from './SocketEvent';
import IceCandidateEvent from './IceCandidateEvent';
import Config from './Config';
import OfferEvent from './OfferEvent';
import AnswerEvent from './AnswerEvent';

export default class PeerClient {

  // Properties

  config: Config;
  name: string;
  socket: SocketIOClient.Socket;
  peerConnection?: RTCPeerConnection;
  localStream: MediaStream;
  remoteStream?: MediaStream;

  authorizedCallback = (payload?: any) => { };
  unauthorizedCallback = (payload?: any) => { };
  disconnectedCallback = (payload?: any) => { };
  receivedStreamCallback = (payload?: any) => { };

  // Initialize

  constructor(config: Config, name: string, localStream: MediaStream) {
    this.config = config;
    this.name = name;
    this.localStream = localStream;
    this.socket = io(config.uri);
    this.registerEvents();
  }

  // Internal methods

  private registerEvents = () => {
    this.socket.on("connect", () => {
      console.log("Connected");

      this.socket.emit("authentication", {
        name: this.name,
      });
    });

    this.socket.on("unauthorized", (reason: string) => {
      console.log("Unauthorized: ", reason);
      this.socket.disconnect();
      this.fire(SocketEvent.Unauthorized);
    });

    this.socket.on("authorized", () => {
      this.fire(SocketEvent.Authorized);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log(`Disconnected: ${reason}`);
      this.fire(SocketEvent.Disconnected);
    });

    this.socket.on("joined", (room: string) => {
      console.log(`Joined to room ${room}`);
      this.socket.emit("ready", room);
    });

    this.socket.on("ready", () => {
      console.log(`Ready`);

      if (this.config.isCaller) {
        this.createPeerConnection();
        this.createOffer();
      }
    });

    this.socket.on('offer', (sdp: RTCSessionDescriptionInit) => {
      console.log('Received Offer', sdp);
      this.createPeerConnection();
      this.createAnswer(sdp);
    });

    this.socket.on('answer', (sdp: RTCSessionDescriptionInit) => {
      console.log('Received Answer', sdp);
      this.peerConnection?.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    this.socket.on('candidate', (event: IceCandidateEvent) => {
      const candidate = new RTCIceCandidate({
        sdpMLineIndex: event.sdpMLineIndex,
        candidate: event.candidate
      });
      console.log('Received Candidate', candidate);
      this.peerConnection?.addIceCandidate(candidate);
    });
  }

  private onAddStream = (event: RTCTrackEvent) => {
    console.log("Received Remote Stream", event);
    const stream = event.streams[0];
    this.fire(SocketEvent.ReceivedStream, stream);
    this.remoteStream = stream;
  };

  private onIceCandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      console.log('Sending Ice Candidate', event.candidate);

      const data: IceCandidateEvent = {
        type: 'candidate',
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        sdpMid: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
        room: this.config.roomId
      }
      this.socket.emit('candidate', data);
    }
  };

  private createPeerConnection = () => {
    const localStream = this.localStream;
    this.peerConnection = new RTCPeerConnection(this.config.rtcConfig);
    this.peerConnection.onicecandidate = this.onIceCandidate;
    this.peerConnection.ontrack = this.onAddStream;
    this.peerConnection.addTrack(localStream.getTracks()[0], localStream);
    this.peerConnection.addTrack(localStream.getTracks()[1], localStream);
  }

  private createOffer = () => {
    this.createPeerConnection();
    this.peerConnection?.createOffer()
      .then(sessionDescription => {
        console.log("Sending Offer", sessionDescription);
        this.peerConnection?.setLocalDescription(sessionDescription);
        const data: OfferEvent = {
          type: "offer",
          sdp: sessionDescription,
          room: this.config.roomId 
        }
        this.socket.emit("offer", data);
      })
      .catch((error) => {
        console.log("An error ocurred - createPeerConnection", error);
      });
  }

  private createAnswer = (sdp: RTCSessionDescriptionInit) => {
    this.createPeerConnection();
    this.peerConnection?.setRemoteDescription(new RTCSessionDescription(sdp));
    this.peerConnection?.createAnswer()
      .then(sessionDescription => {
        this.peerConnection?.setLocalDescription(sessionDescription);

        console.log("Sending Answer", sessionDescription);
        const data: AnswerEvent = {
          type: "answer",
          sdp: sessionDescription,
          room: this.config.roomId,
        }
        this.socket.emit("answer", data);
      })
      .catch((error) => {
        console.log("An error ocurred creating answer", error);
      });
  }

  private fire = (event: SocketEvent, payload?: any) => {
    switch (event) {
      case SocketEvent.Authorized: {
        this.authorizedCallback(payload);
        break;
      }
      case SocketEvent.Unauthorized: {
        this.unauthorizedCallback(payload);
        break;
      }
      case SocketEvent.Disconnected: {
        this.disconnectedCallback(payload);
        break;
      }
      case SocketEvent.ReceivedStream: {
        this.receivedStreamCallback(payload);
        break;
      }
    }
  }

  // Public methods

  public authenticate = () => {
    this.socket.open();
  }

  public on = (event: SocketEvent, callback: (payload?: any) => void) => {
    switch (event) {
      case SocketEvent.Authorized: {
        this.authorizedCallback = callback;
        break;
      }
      case SocketEvent.Unauthorized: {
        this.unauthorizedCallback = callback;
        break;
      }
      case SocketEvent.Disconnected: {
        this.disconnectedCallback = callback;
        break;
      }
      case SocketEvent.ReceivedStream: {
        this.receivedStreamCallback = callback;
        break;
      }
    }
  }
}