const iceServers = {
  'iceServer': [
    { 'urls': 'stun:stun.services.mozilla.com' },
    { 'urls': 'stun:stun.l.google.com:19302' }
  ]
};

const streamConstraints = {
  audio: true,
  video: true
};

export { iceServers, streamConstraints };