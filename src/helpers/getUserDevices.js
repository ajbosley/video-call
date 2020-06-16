const getUserDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  let audioDevices = [],
    videoDevices = [];
  if (devices && devices.length > 0) {
    devices.forEach((device) => {
      if (device.kind && device.kind === "audioinput") {
        audioDevices.push(device);
      }
      if (device.kind && device.kind === "videoinput") {
        videoDevices.push(device);
      }
    });
    audioDevices = formatDeviceLabels(audioDevices);
    videoDevices = formatDeviceLabels(videoDevices);
    return { audioDevices, videoDevices };
  } else {
    return { error: "No devices found" };
  }
};
export default getUserDevices;
function formatDeviceLabels(devices) {
  let newDevices = devices.map((device) => {
    if (device.deviceId === "default") {
      device.label.replace("Default - ", "");
    }
    if (device.label.includes("(Built-in)")) {
      device.label.replace("(Built-in)", "");
    }
    return device;
  });
  return newDevices;
}
