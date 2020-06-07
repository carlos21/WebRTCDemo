enum SocketEvent {
  JoinedRoom = "joined",
  Unauthorized = "unauthorized",
  Disconnected = "disconnected",
  ReceivedStream = "receivedStream",
  Message = "message",
  ConfirmNewSession = "confirmnewsession",
  RemoteAudioMuted = "muted-audio",
  RemoteVideoMuted = "muted-video",
}

export default SocketEvent;