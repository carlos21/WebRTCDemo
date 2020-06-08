import SocketEvent from './SocketEvent';
import IceCandidateEvent from './IceCandidateEvent';
import Config from './Config';
import OfferEvent from './OfferEvent';
import AnswerEvent from './AnswerEvent';
import io from 'socket.io-client';
import ErrorResponse from '../responses/ErrorResponse';
import ErrorDataResponse from '../responses/ErrorDataResponse';

export default class PeerClient {

  // Properties

  socketId?: string;
  config: Config;
  token: string;
  room: string;
  io: SocketIOClient.Socket;
  peerConnection?: RTCPeerConnection;
  localStream: MediaStream;
  remoteStream?: MediaStream;
  localVideoRtpSender?: RTCRtpSender;

  joinedRoomCallback = (payload?: any) => { };
  unauthorizedCallback = (payload?: any) => { };
  disconnectedCallback = (payload?: any) => { };
  receivedStreamCallback = (payload?: any) => { };
  confirmNewSessionCallback = (payload?: any) => { };
  mutedRemoteVideoCallback = (payload?: any) => { };
  mutedRemoteAudioCallback = (payload?: any) => { };

  // Initialize

  constructor(config: Config, username: string, room: string, token: string, localStream: MediaStream, force: boolean = false) {
    this.config = config;
    this.room = room;
    this.token = token;
    this.localStream = localStream;
    this.io = io(config.uri, { 
      query: `auth_token=${token}&username=${username}&room=${room}&force=${force}`,
      path: config.socketPath
    });
    this.registerEvents();
  }

  // Internal methods

  private registerEvents = () => {
    this.io.on("connect", (socket: any) => {
      console.log("Connected socket");
      console.log(socket);
    });

    this.io.on("unauthorized", (reason: string) => {
      console.log("Unauthorized: ", reason);
      this.io.disconnect();
      this.fire(SocketEvent.Unauthorized);
    });
 
    this.io.on("joined", (event: any) => {
      console.log(`Joined to room ${event.room}`);
      console.log(event.socketId);
      this.socketId = event.socketId as string;
      this.fire(SocketEvent.JoinedRoom);
      this.createOffer();
    });

    this.io.on('offer', (sdp: RTCSessionDescriptionInit) => {
      console.log('Received Offer', sdp);
      this.createAnswer(sdp);
    });

    this.io.on('answer', (sdp: RTCSessionDescriptionInit) => {
      console.log('Received Answer', sdp);
      this.peerConnection?.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    this.io.on('mute-video', (enabled: boolean) => {
      console.log('Remote video is muted');
      this.fire(SocketEvent.RemoteVideoMuted, enabled);
    });

    this.io.on('mute-audio', (enabled: boolean) => {
      console.log('Remote audio is muted');
      this.fire(SocketEvent.RemoteAudioMuted, enabled);
    });

    this.io.on('candidate', (event: IceCandidateEvent) => {
      const candidate = new RTCIceCandidate({
        sdpMLineIndex: event.sdpMLineIndex,
        candidate: event.candidate
      });
      console.log('Received Candidate', candidate);
      this.peerConnection?.addIceCandidate(candidate);
    });

    this.io.on("disconnect", (reason: string) => {
      console.log(`Disconnected: ${reason}`);
      this.fire(SocketEvent.Disconnected);
    });

    this.io.on('customerror', (response: any) => {
      console.log('Custom error', response);
    });

    this.io.on('error', (response: ErrorResponse) => {
      const data = response.data as ErrorDataResponse;
      if (data.show) {
        this.fire(SocketEvent.ConfirmNewSession, data.message);
      }
      console.log("error", response);
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
        room: this.room,
        socketId: this.socketId!
      }
      this.io.emit('candidate', data);
    }
  };

  private onNegotiationNeeded = (event: Event) => {
    console.log("onNegotiationNeeded!!!!!");
    // this.createOffer();
  }

  private createPeerConnection = () => {
    const localStream = this.localStream;
    this.peerConnection = new RTCPeerConnection(this.config.rtcConfig);
    this.peerConnection.onicecandidate = this.onIceCandidate;
    this.peerConnection.ontrack = this.onAddStream;
    this.peerConnection.onnegotiationneeded = this.onNegotiationNeeded;

    const audioTrack = this.getAudioTrack(localStream);
    if (audioTrack) {
      this.peerConnection.addTrack(audioTrack, localStream);
      console.log("added audioTrack");
    }

    const videoTrack = this.getVideoTrack(localStream);
    if (videoTrack) {
      this.localVideoRtpSender = this.peerConnection.addTrack(videoTrack, localStream);
      console.log("added videoTrack");
    }
  }

  // toggleVideo = (enabled: boolean) => {
  //   const localStream = this.localStream;
  //   if (enabled) {
  //     this.localVideoRtpSender = this.peerConnection?.addTrack(localStream.getTracks()[1], localStream);
  //   } else {
  //     this.peerConnection?.removeTrack(this.localVideoRtpSender!);
  //     console.log("REMOVING TRACK CTM");
  //   }
  // }

  private getAudioTrack = (stream?: MediaStream): MediaStreamTrack | undefined => {
    return stream?.getTracks().find(track => track.kind === 'audio')
  }

  private getVideoTrack = (stream?: MediaStream): MediaStreamTrack | undefined => {
    return stream?.getTracks().find(track => track.kind === 'video')
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
          room: this.room,
          socketId: this.socketId!
        }
        this.io.emit("offer", data);
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
          room: this.room,
          socketId: this.socketId!
        }
        this.io.emit("answer", data);
      })
      .catch((error) => {
        console.log("An error ocurred creating answer", error);
      });
  }

  private fire = (event: SocketEvent, payload?: any) => {
    switch (event) {
      case SocketEvent.JoinedRoom: {
        this.joinedRoomCallback(payload);
        break;
      }
      case SocketEvent.ConfirmNewSession: {
        this.confirmNewSessionCallback(payload);
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
      case SocketEvent.RemoteAudioMuted: {
        this.mutedRemoteAudioCallback(payload);
        break;
      }
      case SocketEvent.RemoteVideoMuted: {
        this.mutedRemoteVideoCallback(payload);
        break;
      }
    }
  }

  // Public methods

  public authenticate = () => {
    this.io.connect();
  }

  public emit = (event: string, data: any) => {
    this.io.emit(event, { room: this.room, enabled: data });
  };

  public on = (event: SocketEvent, callback: (payload?: any) => void) => {
    switch (event) {
      case SocketEvent.JoinedRoom: {
        this.joinedRoomCallback = callback;
        break;
      }
      case SocketEvent.ConfirmNewSession: {
        this.confirmNewSessionCallback = callback;
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
      case SocketEvent.RemoteAudioMuted: {
        this.mutedRemoteAudioCallback = callback;
        break;
      }
      case SocketEvent.RemoteVideoMuted: {
        this.mutedRemoteVideoCallback = callback;
        break;
      }
    }
  }
}