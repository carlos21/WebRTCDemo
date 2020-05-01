export default interface OfferEvent {
  type: string,
  sdp: RTCSessionDescriptionInit,
  room: string
}