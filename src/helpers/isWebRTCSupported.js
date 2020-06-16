const isWebRTCSupported = () =>
  (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia) &&
  window.RTCPeerConnection;
export default isWebRTCSupported;
