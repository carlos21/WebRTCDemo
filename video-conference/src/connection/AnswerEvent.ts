export default interface AnswerEvent {
  type: string;
  sdp: RTCSessionDescriptionInit;
  room: string;
  socketId: string;
}