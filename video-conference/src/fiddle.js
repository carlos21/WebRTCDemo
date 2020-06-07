var pc1 = new RTCPeerConnection(), pc2 = new RTCPeerConnection();

var add = (pc, can) => can && pc.addIceCandidate(can).catch(log);
pc1.onicecandidate = e => add(pc2, e.candidate);
pc2.onicecandidate = e => add(pc1, e.candidate);

pc2.oniceconnectionstatechange = () => update(statediv, pc2.iceConnectionState);
pc2.onaddstream = e => v2.srcObject = e.stream;

var mute = () => v1.srcObject.getTracks().forEach(t => t.enabled = !t.enabled);

var start = () => navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => (pc1.addStream(v1.srcObject = stream), pc1.createOffer()))
  .then(offer => pc1.setLocalDescription(offer))
  .then(() => pc2.setRemoteDescription(pc1.localDescription))
  .then(() => pc2.createAnswer())
  .then(answer => pc2.setLocalDescription(answer))
  .then(() => pc1.setRemoteDescription(pc2.localDescription))
  .then(() => repeat(10, () => Promise.all([pc1.getStats(), pc2.getStats()])
    .then(([s1, s2]) => {
      var s = "";
      s1.forEach(stat => {
        if (stat.type == "outbound-rtp" && !stat.isRemote) {
          s += "<h4>Sender side</h4>" + dumpStats(stat);
        }
      });
      s2.forEach(stat => {
        if (stat.type == "inbound-rtp" && !stat.isRemote) {
          s += "<h4>Receiver side</h4>" + dumpStats(stat);
        }
      });
      update(statsdiv, "<small>" + s + "</small>");
    })))
  .catch(e => log(e));

function dumpStats(o) {
  var s = "Timestamp: " + new Date(o.timestamp).toTimeString() + " Type: " + o.type + "<br>";
  if (o.ssrc !== undefined) s += "SSRC: " + o.ssrc + " ";
  if (o.packetsReceived !== undefined) {
    s += "Recvd: " + o.packetsReceived + " packets";
    if (o.bytesReceived !== undefined) {
      s += " (" + (o.bytesReceived / 1024000).toFixed(2) + " MB)";
    }
    if (o.packetsLost !== undefined) s += " Lost: " + o.packetsLost;
  } else if (o.packetsSent !== undefined) {
    s += "Sent: " + o.packetsSent + " packets";
    if (o.bytesSent !== undefined) s += " (" + (o.bytesSent / 1024000).toFixed(2) + " MB)";
  } else {
    s += "<br><br>";
  }
  s += "<br>";
  if (o.bitrateMean !== undefined) {
    s += " Avg. bitrate: " + (o.bitrateMean / 1000000).toFixed(2) + " Mbps";
    if (o.bitrateStdDev !== undefined) {
      s += " (" + (o.bitrateStdDev / 1000000).toFixed(2) + " StdDev)";
    }
    if (o.discardedPackets !== undefined) {
      s += " Discarded packts: " + o.discardedPackets;
    }
  }
  s += "<br>";
  if (o.framerateMean !== undefined) {
    s += " Avg. framerate: " + (o.framerateMean).toFixed(2) + " fps";
    if (o.framerateStdDev !== undefined) {
      s += " (" + o.framerateStdDev.toFixed(2) + " StdDev)";
    }
  }
  if (o.droppedFrames !== undefined) s += " Dropped frames: " + o.droppedFrames;
  if (o.jitter !== undefined) s += " Jitter: " + o.jitter;
  return s;
}

var wait = ms => new Promise(r => setTimeout(r, ms));
var repeat = (ms, func) => new Promise(r => (setInterval(func, ms), wait(ms).then(r)));
var log = msg => div.innerHTML = div.innerHTML + msg + "<br>";
var update = (div, msg) => div.innerHTML = msg;