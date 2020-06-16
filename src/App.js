import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import isWebRTCSupported from "./helpers/isWebRTCSupported";
import hasGetUserMedia from "./helpers/hasGetUserMedia";
import getBrowserName from "./helpers/getBrowserName";
import getURLParams from "./helpers/getURLParams";
import getUserDevices from "./helpers/getUserDevices";
function App() {
  const [constraints, setConstraints] = useState({
    audio: true,
    video: { facingMode: { exact: "user" } },
  });
  const [roomId, setRoomId] = useState();
  const outgoingRef = useRef();
  const incomingRef = useRef();
  const socket = useRef();
  // device related state
  const [devices, setDevices] = useState();
  const [audioInput, setAudioInput] = useState("default");
  const [videoInput, setVideoInput] = useState("default");
  const [outgoingStream, setOutgoingStream] = useState();
  const [incomingStream, setIncomingStream] = useState();
  // decision related state
  const [isInitiator, setIsInitiator] = useState();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callerSignal, setCallerSignal] = useState();
  // peer related
  const inPeer = useRef();
  const outPeer = useRef();
  const iceServers = [
    {
      url: "stun:stun.dochq.co.uk:5349",
    },
    {
      url: "turn:turn.dochq.co.uk:5349?transport=udp",
      credential: "somepassword",
      username: "guest",
    },
    {
      url: "turn:turn.dochq.co.uk:5349?transport=tcp",
      credential: "somepassword",
      username: "guest",
    },
  ];
  // check browsers and capability
  useEffect(() => {
    if (
      isWebRTCSupported() &&
      hasGetUserMedia() &&
      typeof devices === "undefined"
    ) {
      getDevices();
    } else if (!isWebRTCSupported() || !hasGetUserMedia) {
      // TODO add redirect and create page for redirection based on browser etc
      // browser unsupported
      // getbrowser details for redirect, also need device details if possible I guess
      const browserName = getBrowserName();
    } else {
      console.log("i am confused");
    }
  });

  // Get room from URL Params
  useEffect(() => {
    const params = getURLParams(window.location.search);
    if (params["roomId"]) {
      setRoomId(params["roomId"]);
    } else {
      setRoomId("unknown");
    }
  });
  // if can stream and not in call create call
  useEffect(() => {
    if (isStreaming && !isCalling && !callAccepted) {
    }
  }, [isStreaming]);
  // handle all web socket comms
  useEffect(() => {
    socket.current = io.connect("localhost:80/", {
      transports: ["websocket"],
    });
    socket.current.on("connect", () => {
      // socket join room
      socket.current.emit("join", roomId);
    });
    socket.current.on("full", () => alert("room is full"));
    socket.current.on("ready", (e) => console.log(e));
    socket.current.on("willInitiateCall", (e) => console.log(e));
    socket.current.on("offer", handleOffer);
    socket.current.on("answer", (e) => console.log(e));
    socket.current.on("candidate", (e) => console.log(e));
  }, []);
  // get devices
  function getDevices() {
    getUserDevices()
      .then((devices) => {
        setDevices(devices);
      })
      .catch((err) => {
        //TODO TOAST
        alert("issue getting devices");
      });
  }
  // get user media
  function startOutgoingCamera() {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(handleSuccessStream)
      .catch(handleErrorStream);
  }
  // successfully got media
  function handleSuccessStream(stream) {
    outgoingRef.current.srcObject = stream;
    outgoingRef.current.play().catch(() => console.log("error playing"));
    setOutgoingStream(stream);
    setIsStreaming(true);
    console.log("is streaming");
  }
  // error getting media
  function handleErrorStream(error) {
    console.log("getUserMedia error: ", error);
  }

  // create peer
  function createOutPeer() {
    inPeer.current = new RTCPeerConnection({
      iceServers: [...iceServers],
    });
    outgoingStream.getTracks().forEach(function (track) {
      inPeer.current.addTrack(track, outgoingStream);
    });
  }

  function createOffer(peer) {
    peer.createOffer(
      (offer) => {
        peer.setLocalDescription(offer);
        socket.emit("offer", JSON.stringify(offer), roomId);
      },
      (err) => {
        alert("error creating offer");
      }
    );
  }
  // handle offer and create answer
  function handleOffer(peer, offer) {
    let rtcOffer = new RTCSessionDescription(JSON.parse(offer));
    peer.setRemoteDescription(rtcOffer);
    peer.createAnswer(
      (answer) => {
        peer.setLocalDescription(answer);
        socket.emit("answer", JSON.stringify(answer), roomId);
      },
      (err) => {
        alert("error creating answer");
      }
    );
  }
  // handle answer
  function gotAnswer(peer, answer) {
    let rtcAnswer = new RTCSessionDescription(JSON.parse(answer));
    // Set remote description of RTCSession
    peer.setRemoteDescription(rtcAnswer);
  }

  // update constraints
  function updateConstraints(field, id) {
    let newCons = constraints;
    newCons[field] = { deviceId: { exact: id } };
    setConstraints(newCons);
  }
  return (
    <React.Fragment>
      <div className="controls">
        <button>Start Call</button>
        <button>Mute</button>
        <p>audio</p>
        <select
          onChange={(e) => {
            updateConstraints("audio", e.target.value);
          }}
        >
          {devices &&
            devices.audioDevices &&
            devices.audioDevices.map((device) => (
              <option value={device.deviceId} key={device.deviceId}>
                {device.label}
              </option>
            ))}
        </select>
        <p>video</p>
        <select
          onChange={(e) => {
            updateConstraints("video", e.target.value);
          }}
        >
          {devices &&
            devices.videoDevices &&
            devices.videoDevices.map((device) => (
              <option value={device.deviceId} key={device.deviceId}>
                {device.label}
              </option>
            ))}
        </select>
      </div>
      <div className="incoming-video">
        <p>Incoming video</p>
        <video id="incoming" ref={incomingRef} playsInline autoPlay></video>
      </div>
      <div className="outgoing-video">
        <p>Outgoing video</p>
        <video
          id="outgoing"
          ref={outgoingRef}
          playsInline
          muted
          autoPlay
        ></video>
      </div>
    </React.Fragment>
  );
}

export default App;
