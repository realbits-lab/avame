import React from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
import { isMobile } from "react-device-detect";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Fab from "@mui/material/Fab";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Badge from "@mui/material/Badge";
import PhoneEnabledIcon from "@mui/icons-material/PhoneEnabled";
import PhoneForwardedIcon from "@mui/icons-material/PhoneForwarded";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import Remon from "@remotemonster/sdk/remon.min";
import ConnectLive from "@connectlive/connectlive-web-sdk";
import { AlertSeverity, isUserAllowed } from "rent-market";
import {
  PaperComponent,
  ScreenPosition,
  RBSnackbar,
  BootstrapDialogTitle,
  Transition,
} from "./RealBitsUtil";
import RoomList from "./RoomList";

function VideoChat({
  inputGetMediaStreamFuncRef,
  inputSetAvatarPositionFuncRef,
  inputSetBackgroundScreenFuncRef,
  rentMarketRef,
}) {
  //*---------------------------------------------------------------------------
  //* Define kakaco connect live key.
  //*---------------------------------------------------------------------------
  const KAKAO_CONNECT_LIVE_TOKEN_GENERATE_URL = "/api/chat/generate";
  const KAKAO_CONNECT_LIVE_SERVICE_ID =
    process.env.NEXT_PUBLIC_KAKAO_CONNECT_LIVE_SERVICE_ID;
  // const KAKAO_CONNECT_LIVE_SERVICE_ID_SCHEME = "internal";
  const KAKAO_CONNECT_LIVE_SERVICE_ID_SCHEME = "external";
  const KAKAO_CONNECT_LIVE_SERVICE_SECRET =
    process.env.NEXT_PUBLIC_KAKAO_CONNECT_LIVE_SERVICE_SECRET;
  const KAKAO_CONNECT_LIVE_ADMIN_SECRET =
    process.env.NEXT_PUBLIC_KAKAO_CONNECT_LIVE_ADMIN_SECRET;
  const KAKAO_CONNECT_LIVE_PROVISION_REQUEST_URL =
    process.env.NEXT_PUBLIC_KAKAO_CONNECT_LIVE_PROVISION_REQUEST_URL;
  const KAKAO_CONNECT_LIVE_ROOM_REQUEST_URL =
    process.env.NEXT_PUBLIC_KAKAO_CONNECT_LIVE_ROOM_REQUEST_URL;
  const kakaoTokenRef = React.useRef("");
  const ALLOW_MESSAGE = "You must own or rent NFT to use this function.";

  //*---------------------------------------------------------------------------
  //* Define input copied variables.
  //*---------------------------------------------------------------------------
  const getMediaStreamFuncRef = React.useRef();
  const setAvatarPositionFuncRef = React.useRef();

  //*---------------------------------------------------------------------------
  //* Define enum variables.
  //*---------------------------------------------------------------------------
  const LocalVideoSource = {
    avatarWithoutCamera: "avatarWithoutCamera",
    avatarWithCamera: "avatarWithCamera",
    cameraWithoutAvatar: "cameraWithoutAvatar",
  };
  const CallStatus = {
    close: "close",
    wait: "wait",
    talk: "talk",
  };
  const CallUserType = {
    host: "host",
    guest: "guest",
    none: "none",
  };
  const ChatView = {
    localMain: "localMain",
    remoteMain: "remoteMain",
  };

  //*---------------------------------------------------------------------------
  //* Handle room title input change.
  //*---------------------------------------------------------------------------
  const [formValue, setFormValue] = React.useState({
    roomTitle: "",
  });
  const { roomTitle } = formValue;
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValue((prevState) => {
      return {
        ...prevState,
        [name]: value,
      };
    });
  };

  //*---------------------------------------------------------------------------
  //* Other variables.
  //*---------------------------------------------------------------------------
  const [openRoomDialog, setOpenRoomDialog] = React.useState(false);
  const [openRoomTitleInputDialog, setOpenRoomTitleInputDialog] =
    React.useState(false);
  const [roomList, setRoomList] = React.useState([]);
  const [callStatus, setCallStatus] = React.useState(CallStatus.close);
  const [localVideoSource, setLocalVideoSource] = React.useState(
    LocalVideoSource.avatarWithoutCamera
  );
  const [showVideoChatButton, setShowVideoChatButton] = React.useState(false);

  //*---------------------------------------------------------------------------
  //* Function and variable references.
  //*---------------------------------------------------------------------------
  const callStatusRef = React.useRef(CallStatus.close);
  const remoteVideoRef = React.useRef();
  const localCameraStreamVideoRef = React.useRef();
  const screenStreamVideoRef = React.useRef();
  const remonCall = React.useRef();
  const localMediaRef = React.useRef();
  const roomRef = React.useRef();
  const currentConnectedRoomId = React.useRef();

  //*---------------------------------------------------------------------------
  //* Handle toast mesage.
  //*---------------------------------------------------------------------------
  const [snackbarValue, setSnackbarValue] = React.useState({
    snackbarSeverity: AlertSeverity.info,
    snackbarMessage: "",
    snackbarTime: new Date(),
    snackbarOpen: true,
  });
  const { snackbarSeverity, snackbarMessage, snackbarTime, snackbarOpen } =
    snackbarValue;

  React.useEffect(() => {
    console.log("call useEffect()");

    async function checkAuth() {
      // console.log("call checkAuth()");
      let response;

      // Get user token from auth API server.
      response = await axios.get(
        `${KAKAO_CONNECT_LIVE_TOKEN_GENERATE_URL}?admin=false`
      );
      // console.log("response: ", response);

      const userToken = response.data.token;
      // console.log("userToken: ", userToken);

      // Get admin token from auth API server.
      // response = await axios.get(
      //   `${KAKAO_CONNECT_LIVE_TOKEN_GENERATE_URL}?isAdmin=true`
      // );
      // console.log("isAdmin true response: ", response);
      // const adminToken = response.data.token;
      // console.log("adminToken: ", adminToken);
      // kakaoTokenRef.current = adminToken;

      //* Sign in connect live.
      // https://docs.kakaoi.ai/connect_live/ver2.0/api/web/method/#signin_%EC%84%9C%EB%B9%84%EC%8A%A4-%EC%9E%90%EC%B2%B4-%EC%9D%B8%EC%A6%9D
      //* TODO: Should run auth server with public address for kakao connect live server to connect.
      const signInResponse = await ConnectLive.signIn({
        serviceId: process.env.NEXT_PUBLIC_KAKAO_CONNECT_LIVE_SERVICE_ID,
        // serviceSecret: KAKAO_CONNECT_LIVE_SERVICE_SECRET,
        token: userToken,
      });
      // console.log("signInResponse: ", signInResponse);

      if (signInResponse !== undefined) {
        console.error(signInResponse);
        return;
      }

      //* Make a provistion for administrator function.
      try {
        await makeProvision();
      } catch (error) {
        console.error(error);
      }

      //* Make a room for chatting.
      roomRef.current = ConnectLive.createRoom();
      if (!roomRef.current) {
        throw new Error("Failed to create roomRef.current");
      }
      // console.log("roomRef.current: ", roomRef.current);

      //* TODO: Connect a room after reloading page.
      // Check the previous connected room id.
      const kakaoConnectLiveRoomId = localStorage.getItem(
        "kakaoConnectLiveRoomId"
      );
      // console.log("kakaoConnectLiveRoomId: ", kakaoConnectLiveRoomId);
      // if (
      //   kakaoConnectLiveRoomId !== null &&
      //   kakaoConnectLiveRoomId !== currentConnectedRoomId.current
      // ) {
      //   roomRef.current.connect(kakaoConnectLiveRoomId).then(function () {
      //     localStorage.setItem(
      //       "kakaoConnectLiveRoomId",
      //       kakaoConnectLiveRoomId
      //     );
      //     currentConnectedRoomId.current = kakaoConnectLiveRoomId;
      //   });
      // }
    }
    // console.log("call useEffect()");

    //* Turn off the log.
    // 'trace' | 'debug' | 'info' | 'error' | 'off'
    ConnectLive.logger.setLevel("off");

    //* Call checkAuth function.
    checkAuth();

    //* Set function reference.
    getMediaStreamFuncRef.current = inputGetMediaStreamFuncRef.current;
    setAvatarPositionFuncRef.current = inputSetAvatarPositionFuncRef.current;
    inputSetBackgroundScreenFuncRef.current = setBackgroundScreen;

    console.log("process.env: ", process.env);
    if (process.env.NODE_ENV === "production") {
      setShowVideoChatButton(false);
    } else {
      setShowVideoChatButton(true);
    }
  }, [
    inputGetMediaStreamFuncRef,
    inputSetAvatarPositionFuncRef,
    inputSetBackgroundScreenFuncRef,
  ]);

  function createHashValue({ serviceId, adminSecret, nonce }) {
    const dataForHash = `${serviceId}:${adminSecret}`;
    const hash = CryptoJS.SHA256(dataForHash).toString(CryptoJS.enc.Hex);
    // console.log("hash: ", hash);
    const dataForValue = `${hash}:${nonce}`;
    const value = CryptoJS.SHA256(dataForValue).toString(CryptoJS.enc.Hex);
    // console.log("value: ", value);

    return value;
  }

  async function makeProvision() {
    // console.log("call makeProvision()");

    let response;
    let nonce;
    let data;

    let uuid, token, ttl, api;

    const axiosInstance = axios.create({
      baseURL: KAKAO_CONNECT_LIVE_PROVISION_REQUEST_URL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    //* Make 1st request.
    // data = {
    //   jsonrpc: "2.0",
    //   id: "1",
    //   method: "Provision",
    //   params: {
    //     version: "1.0",
    //     serviceId: KAKAO_CONNECT_LIVE_SERVICE_ID,
    //     scheme: KAKAO_CONNECT_LIVE_SERVICE_ID_SCHEME,
    //   },
    // };
    // response = await axiosInstance.post(
    //   KAKAO_CONNECT_LIVE_PROVISION_REQUEST_URL,
    //   data
    // );
    // console.log("1st provision request response: ", response);

    // if (
    //   response.data !== undefined &&
    //   response.data.error !== undefined &&
    //   response.data.error.code !== undefined &&
    //   response.data.error.code === -11002
    // ) {
    //   nonce = response.data.error.data.nonce;
    // } else {
    //   throw response.data.error;
    // }
    // console.log("nonce: ", nonce);

    //* Make 2nd request.
    response = await axios.get(
      `${KAKAO_CONNECT_LIVE_TOKEN_GENERATE_URL}?admin=true`
    );
    // console.log("isAdmin true response: ", response);
    nonce = response.data.token;
    // console.log("nonce: ", nonce);

    const hashValue = createHashValue({
      serviceId: KAKAO_CONNECT_LIVE_SERVICE_ID,
      adminSecret: KAKAO_CONNECT_LIVE_ADMIN_SECRET,
      nonce: nonce,
    });
    // console.log(`Calculated hashValue is : ${hashValue}`);

    data = {
      jsonrpc: "2.0",
      id: "2",
      method: "Provision",
      params: {
        version: "1.0",
        serviceId: KAKAO_CONNECT_LIVE_SERVICE_ID,
        scheme: KAKAO_CONNECT_LIVE_SERVICE_ID_SCHEME,
        auth: {
          nonce: nonce,
          key: KAKAO_CONNECT_LIVE_SERVICE_ID,
          // value: hashValue,
          value: nonce,
        },
      },
    };
    response = await axiosInstance.post(
      KAKAO_CONNECT_LIVE_PROVISION_REQUEST_URL,
      data
    );
    // console.log("2nd provision request response: ", response);

    if (response.data !== undefined && response.data.result !== undefined) {
      // {
      //     "jsonrpc": "2.0",
      //     "id": "2",
      //     "result": {
      //         "uuid": "{UUID}",
      //         "token": "{TOKEN}",
      //         "ttl": {TTL},
      //         "api": "{API_URL}"
      //     }
      // }
      uuid = response.data.result.uuid;
      token = response.data.result.token;
      // TODO: Handle ttl.
      ttl = response.data.result.ttl;
      api = response.data.result.api;

      // console.log("uuid: ", uuid);
      // console.log("token: ", token);
      // console.log("ttl: ", ttl);
      // console.log("api: ", api);

      kakaoTokenRef.current = token;
    } else {
      throw response.data.error;
    }
  }

  function setBackgroundScreen(screenStreamVideo) {
    // console.log("call setBackgroundScreen()");

    let backgroundStreamRef;
    let showAvatarOption = true;

    screenStreamVideoRef.current = screenStreamVideo;

    if (localVideoSource === LocalVideoSource.avatarWithoutCamera) {
      backgroundStreamRef = screenStreamVideoRef;
    } else {
      backgroundStreamRef = localCameraStreamVideoRef;
    }

    if (localVideoSource === LocalVideoSource.avatarWithCamera) {
      showAvatarOption = false;
    }

    changeAvatarScreen({
      showAvatarOption: showAvatarOption,
      backgroundStreamRef: backgroundStreamRef,
    });
  }

  async function makeRoom() {
    // TODO: Change version 2.
    // console.log("call makeRoom()");

    await initializeCall();
    setOpenRoomTitleInputDialog(true);
    await remonCall.current.connectCall();
  }

  async function connectCall(channelId) {
    // TODO: Change version 2.
    // console.log("connectCall function");
    await initializeCall();
    await remonCall.current.connectCall(channelId);
  }

  async function connectRandomCall() {
    // console.log("call connectRandomCall()");

    let response;
    //* For version 2.
    //* Check ConnectLive signIn and createRoom function finished.
    if (roomRef.current === undefined) {
      throw "ConnectList has not been yet finished.";
    }
    // console.log("kakaoTokenRef.current: ", kakaoTokenRef.current);

    //* Get room list.
    //* Request room list data.
    const axiosInstance = axios.create({
      baseURL: KAKAO_CONNECT_LIVE_ROOM_REQUEST_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${kakaoTokenRef.current}`,
      },
      timeout: 5000,
    });
    response = await axiosInstance.post(KAKAO_CONNECT_LIVE_ROOM_REQUEST_URL, {
      jsonrpc: "2.0",
      id: "1",
      method: "Room.ListRooms",
      params: {
        version: "2.0",
      },
    });
    // {
    //     "jsonrpc": "2.0",
    //     "id": "1",
    //     "result": [
    //             "{ROOM_ID_1}",
    //             "{ROOM_ID_2}"
    //         ]
    // }
    // console.log("Room.ListRooms response: ", response);
    //* Check response error.
    if (response.data !== undefined && response.data.error !== undefined) {
      throw response.data.error;
    }

    //* Decide make a new room or connect a pre-made room.
    if (response.data.result === null || response.data.result.length === 0) {
      //* No room case.
      await roomRef.current.connect(uuidv4().replaceAll("-", ""));
    } else {
      //* With room case.
      let oneParticipantRoomId = -1;
      for (const room of response.data.result.rooms) {
        // console.log("room: ", room);
        const roomId = room.roomId;
        //* Check room participant number.
        response = await axiosInstance.post(
          KAKAO_CONNECT_LIVE_ROOM_REQUEST_URL,
          {
            jsonrpc: "2.0",
            id: "1",
            method: "Room.ListParticipants",
            params: {
              version: "2.0",
              roomId: roomId,
            },
          }
        );
        // console.log("Room.ListParticipants response: ", response);
        //* Check response error.
        if (response.data !== undefined && response.data.error !== undefined) {
          throw response.data.error;
        }

        if (response.data.result.participants.length === 1) {
          // Room is not full.
          oneParticipantRoomId = roomId;
          break;
        }
      }
      // console.log("oneParticipantRoomId: ", oneParticipantRoomId);

      if (oneParticipantRoomId !== -1) {
        // console.log("Connect a room: ", oneParticipantRoomId);
        //* Room is not full.
        roomRef.current.connect(oneParticipantRoomId);
        localStorage.setItem("kakaoConnectLiveRoomId", oneParticipantRoomId);
        currentConnectedRoomId.current = oneParticipantRoomId;
      } else {
        // Room is full, so make a new room.
        const newRoomId = uuidv4().replaceAll("-", "");
        // console.log("Make a room: ", newRoomId);
        await roomRef.current.connect(uuidv4().replaceAll("-", ""));
        localStorage.setItem("kakaoConnectLiveRoomId", newRoomId);
        currentConnectedRoomId.current = newRoomId;
      }
    }

    //* Change call status to wait.
    setCallStatus(CallStatus.wait);
    callStatusRef.current = CallStatus.wait;
    setNormalView();

    //* Set room event.
    setRoomEvent();
  }

  function setRoomEvent() {
    roomRef.current.on("remoteVideoPublished", async (evt) => {
      // console.log("-- remoteVideoPublished evt: ", evt);

      //* Subscribe a changed remote media.
      const remoteVideos = await roomRef.current.subscribe([
        evt.remoteVideo.videoId,
      ]);
      // console.log("remoteVideos: ", remoteVideos);

      //* Subscribe a changed remote media.
      remoteVideoRef.current.srcObject = remoteVideos[0].getMediaStream();
    });

    roomRef.current.on("connected", async (participant) => {
      // console.log("-- connected participant: ", participant);

      //* Get remote participants list.
      participant.remoteParticipants.forEach((member) => {
        // console.log("user: " + member.id + " is entered.");
      });

      //* Publish local media to room.
      const mediaStream = await getMediaStreamFuncRef.current();
      // console.log("mediaStream: ", mediaStream);
      localMediaRef.current = await ConnectLive.createLocalMedia({
        audio: true,
        video: true,
      });
      localMediaRef.current.setMediaStream(mediaStream);
      roomRef.current.publish([localMediaRef.current]);

      //* Subscribe remote media, if any.
      if (participant.remoteParticipants.length > 0) {
        for (const remoteParticipant of participant.remoteParticipants) {
          const unsubscribedVideos = remoteParticipant.getUnsubscribedVideos();
          // console.log("unsubscribedVideos: ", unsubscribedVideos);

          if (unsubscribedVideos.length > 0) {
            const remoteVideos = await roomRef.current.subscribe([
              unsubscribedVideos[0].videoId,
            ]);
            remoteVideoRef.current.srcObject = remoteVideos[0].getMediaStream();
            break;
          }
        }
      }

      // 4. Start talk view.
      setCallStatus(CallStatus.talk);
      callStatusRef.current = CallStatus.talk;
      setTalkView();
    });

    roomRef.current.on("participantEntered", (evt) => {
      // console.log("-- participantEntered evt: ", evt);
      // console.log("user: " + evt.remoteParticipant.id + " is entered.");

      //* Start talk view.
      setCallStatus(CallStatus.talk);
      callStatusRef.current = CallStatus.talk;
      setTalkView();
    });

    roomRef.current.on("participantLeft", (evt) => {
      // console.log("-- participantLeft evt: ", evt);
      // console.log("user: " + evt.remoteParticipantId + " is left.");

      //* Close call.
      closeCall();

      //* Start normal view.
      setCallStatus(CallStatus.close);
      callStatusRef.current = CallStatus.close;
      setNormalView();
    });

    roomRef.current.on("disconnected", (reason) => {
      // console.log("-- disconnected reason: ", reason);

      //* Close call.
      closeCall();

      //* Start normal view.
      setCallStatus(CallStatus.close);
      callStatusRef.current = CallStatus.close;
      setNormalView();
    });
  }

  async function getRoomList() {
    const callList = await remonCall.current.fetchCalls();
    setRoomList(callList);
  }

  async function closeCall() {
    // console.log("call closeCall()");

    // For version 2.
    roomRef.current.disconnect();
    localMediaRef.current.stop();
    ConnectLive.signOut();

    // For version 1.
    // await remonCall.current.close();

    // console.log("call setCallStatus(CallStatus.close)");
    setCallStatus(CallStatus.close);
    callStatusRef.current = CallStatus.close;
    currentConnectedRoomId.current = undefined;
    localStorage.removeItem("kakaoConnectLiveRoomId");
  }

  async function initializeCall() {
    // Get media stream.
    const localStream = await getMediaStreamFuncRef.current();
    // console.log("getMediaStreamFuncRef: ", getMediaStreamFuncRef);
    // console.log("localStream: ", localStream);

    //* TODO: Make secure.
    // Set one-to-one configuration.
    const config = {
      credential: {
        serviceId: process.env.NEXT_PUBLIC_KAKAO_LIVE_SERVICE_ID,
        key: process.env.NEXT_PUBLIC_KAKAO_LIVE_KEY,
      },
      view: {
        localStream: localStream,
        remote: "#remoteVideo",
      },
      media: {
        video: true,
        audio: true,
      },
    };

    const listener = {
      onInit(token) {
        // console.log("-- Remon event onInit token: ", token);
        // console.log("call setCallStatus(CallStatus.close)");
        setCallStatus(CallStatus.close);
        callStatusRef.current = CallStatus.close;
        setNormalView();
      },
      onConnect(channelId) {
        // console.log("-- Remon event onConnect channelId: ", channelId);
        // console.log("call setCallStatus(CallStatus.wait)");
        setCallStatus(CallStatus.wait);
        callStatusRef.current = CallStatus.wait;
        setNormalView();
      },
      onComplete() {
        // console.log("-- Remon event onComplete");
        // console.log("call setCallStatus(CallStatus.talk)");
        setCallStatus(CallStatus.talk);
        callStatusRef.current = CallStatus.talk;
        setTalkView();
      },
      onDisconnectChannel() {
        // console.log("-- Remon event onDisconnectChannel");
        closeConnection();
        // console.log("call setCallStatus(CallStatus.close)");
        setCallStatus(CallStatus.close);
        callStatusRef.current = CallStatus.close;
        setNormalView();
      },
      onClose() {
        // console.log("-- Remon event onClose");
        closeConnection();
        // console.log("call setCallStatus(CallStatus.close)");
        setCallStatus(CallStatus.close);
        callStatusRef.current = CallStatus.close;
        setNormalView();
      },
      onError(error) {
        // console.log("-- Remon event onError error: ", error);
        setNormalView();
      },
      onStat(result) {
        // console.log("-- Remon event onStat result: ", result);
        // console.log("callStatus: ", callStatus);
        // console.log("callStatusRef.current: ", callStatusRef.current);
      },
    };

    remonCall.current = new Remon({ config, listener });
    // console.log("remonCall.current: ", remonCall.current);
  }

  function closeConnection() {
    remonCall.current.close();
  }

  function setTalkView() {
    // console.log("call setTalkView()");
    // console.log("callStatus: ", callStatus);
    // console.log("callStatusRef.current: ", callStatusRef.current);
    // console.log("localVideoSource: ", localVideoSource);
    // console.log("screenStreamVideoRef: ", screenStreamVideoRef);
    let backgroundStreamRef;

    // 1. Move remote video to center and show.
    remoteVideoRef.current.style.position = "absolute";
    remoteVideoRef.current.style.zIndex = 5;
    remoteVideoRef.current.style.width = "100%";
    remoteVideoRef.current.style.height = "100%";
    remoteVideoRef.current.style.right = "0px";
    remoteVideoRef.current.style.top = "0px";

    if (localVideoSource === LocalVideoSource.avatarWithoutCamera) {
      backgroundStreamRef = screenStreamVideoRef;
    } else {
      backgroundStreamRef = localCameraStreamVideoRef;
    }

    // 2. Move avatar canvas to the right-bottom side.
    setAvatarPositionFuncRef.current({
      canvasPosition: ScreenPosition.rightTop,
      avatarPosition: ScreenPosition.center,
      screenVideoStreamRef: backgroundStreamRef,
    });
  }

  function setNormalView() {
    // console.log("call setNormalView()");
    // console.log("callStatus: ", callStatus);
    // console.log("callStatusRef.current: ", callStatusRef.current);
    // console.log("localVideoSource: ", localVideoSource);
    // console.log("screenStreamVideoRef: ", screenStreamVideoRef);
    let backgroundStreamRef;

    //* Move remote video to right-top and hide.
    remoteVideoRef.current.style.position = "absolute";
    remoteVideoRef.current.style.zIndex = 0;
    remoteVideoRef.current.style.width = "25%";
    remoteVideoRef.current.style.height = "25%";
    remoteVideoRef.current.style.right = "20px";
    remoteVideoRef.current.style.top = "20px";

    if (localVideoSource === LocalVideoSource.avatarWithoutCamera) {
      backgroundStreamRef = screenStreamVideoRef;
    } else {
      backgroundStreamRef = localCameraStreamVideoRef;
    }

    //* Move avatar canvas to the right-bottom side.
    setAvatarPositionFuncRef.current({
      canvasPosition: ScreenPosition.center,
      avatarPosition: ScreenPosition.center,
      screenVideoStreamRef: backgroundStreamRef,
    });
  }

  async function setLocalCameraStream() {
    // console.log("call setLocalCameraStream()");

    try {
      let localCameraStream = await navigator.mediaDevices.getUserMedia({
        // audio: { echoCancellation: true },
        audio: true,
        video: true,
        // video: { width: 3840, height: 2160 },
      });

      // console.log("localCameraStream: ", localCameraStream);
      // console.log("screen.width: ", screen.width);
      // console.log("screen.height: ", screen.height);

      localCameraStream.fullcanvas = true;
      localCameraStream.width = screen.width;
      localCameraStream.height = screen.height;
      // console.log("localCameraStream: ", localCameraStream);
      localCameraStreamVideoRef.current.srcObject = localCameraStream;
      // console.log("localCameraStreamVideoRef: ", localCameraStreamVideoRef);
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleLocalVideoSource() {
    // console.log("toggleLocalVideoSource");
    // console.log("localVideoSource: ", localVideoSource);
    // console.log("screenStreamVideoRef: ", screenStreamVideoRef);
    let showAvatarOption = true;
    let backgroundStreamRef;

    //* Get local camera stream.
    if (localVideoSource === LocalVideoSource.avatarWithoutCamera) {
      setLocalVideoSource(LocalVideoSource.avatarWithCamera);
      await setLocalCameraStream();
      backgroundStreamRef = localCameraStreamVideoRef;
    } else if (localVideoSource === LocalVideoSource.avatarWithCamera) {
      setLocalVideoSource(LocalVideoSource.cameraWithoutAvatar);
      await setLocalCameraStream();
      showAvatarOption = false;
      backgroundStreamRef = localCameraStreamVideoRef;
    } else {
      setLocalVideoSource(LocalVideoSource.avatarWithoutCamera);
      localCameraStreamVideoRef.current.srcObject = undefined;
      backgroundStreamRef = screenStreamVideoRef;
    }

    changeAvatarScreen({
      showAvatarOption: showAvatarOption,
      backgroundStreamRef: backgroundStreamRef,
    });
  }

  function changeAvatarScreen({ showAvatarOption, backgroundStreamRef }) {
    // console.log("call changeAvatarScreen()");
    // console.log("callStatusRef.current: ", callStatusRef.current);
    // console.log("showAvatarOption: ", showAvatarOption);

    let avatarTransformOption = {};

    //* Set avatar transform option.
    switch (callStatusRef.current) {
      case CallStatus.talk:
        //* Set avatar and chat mode.
        avatarTransformOption = {
          canvasPosition: ScreenPosition.rightTop,
          avatarPosition: ScreenPosition.center,
          screenVideoStreamRef: backgroundStreamRef,
          showAvatarOption,
        };
        break;

      case CallStatus.close:
      case CallStatus.wait:
      default:
        //* Set avatar and no chat mode.
        avatarTransformOption = {
          canvasPosition: ScreenPosition.center,
          avatarPosition: ScreenPosition.center,
          screenVideoStreamRef: backgroundStreamRef,
          showAvatarOption,
        };
        break;
    }

    //* Call transform avatar function.
    // console.log("avatarTransformOption: ", avatarTransformOption);
    setAvatarPositionFuncRef.current(avatarTransformOption);
  }

  return (
    <>
      {/*//*-----------------------------------------------------------------*/}
      {/*//* Remote video element.                                           */}
      {/*//*-----------------------------------------------------------------*/}
      <video
        id="localCameraStreamVideo"
        autoPlay
        ref={localCameraStreamVideoRef}
        hidden={true}
        style={{
          zIndex: -100,
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      ></video>
      <video id="remoteVideo" ref={remoteVideoRef} style={{}} autoPlay />

      <Box
        sx={{
          zIndex: 100,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <List>
          {/*//*-------------------------------------------------------------*/}
          {/*//* Call button.                                                */}
          {/*//*-------------------------------------------------------------*/}
          {showVideoChatButton ? (
            <ListItem key="my">
              <Fab
                color="primary"
                onClick={async () => {
                  if (callStatus === CallStatus.close) {
                    //* TODO: Check user is rentee or owner of NFT.
                    // const response = await isUserAllowed({
                    //   rentMarket: rentMarketRef.current,
                    // });
                    // if (response === false) {
                    //   setSnackbarValue({
                    //     snackbarSeverity: AlertSeverity.info,
                    //     snackbarMessage: ALLOW_MESSAGE,
                    //     snackbarTime: new Date(),
                    //     snackbarOpen: true,
                    //   });
                    //   return;
                    // }

                    // await makeRoom();
                    await connectRandomCall();
                  } else {
                    await closeCall();
                  }
                }}
              >
                {callStatus === CallStatus.close ? (
                  <PhoneEnabledIcon color="secondary" />
                ) : callStatus === CallStatus.wait ? (
                  <PhoneForwardedIcon color="secondary" />
                ) : (
                  <PhoneInTalkIcon color="error" />
                )}
              </Fab>
            </ListItem>
          ) : null}

          {/*//*-------------------------------------------------------------*/}
          {/*//* Toggle button.                                              */}
          {/*//*-------------------------------------------------------------*/}
          {isMobile === false ? (
            <ListItem>
              <Fab
                color="primary"
                onClick={async () => {
                  //* Toggle local video between avatar and camera.
                  await toggleLocalVideoSource();
                }}
              >
                {localVideoSource === LocalVideoSource.avatarWithoutCamera ? (
                  <Badge badgeContent={0} color="secondary">
                    <CameraswitchIcon color="secondary" />
                  </Badge>
                ) : localVideoSource === LocalVideoSource.avatarWithCamera ? (
                  <Badge badgeContent={1} color="secondary">
                    <CameraswitchIcon color="secondary" />
                  </Badge>
                ) : localVideoSource ===
                  LocalVideoSource.cameraWithoutAvatar ? (
                  <Badge badgeContent={2} color="secondary">
                    <CameraswitchIcon color="secondary" />
                  </Badge>
                ) : (
                  <CameraswitchIcon color="error" />
                )}
              </Fab>
            </ListItem>
          ) : null}
        </List>
      </Box>

      {/*//*-----------------------------------------------------------------*/}
      {/*//* Room list button.                                               */}
      {/*//*-----------------------------------------------------------------*/}
      {/* <IconButton
        color="primary"
        onClick={async () => {
          await getRoomList();
          setOpenRoomDialog(true);
        }}
        sx={{
          zIndex: 30,
          position: "absolute",
          right: "10px",
          top: "350px",
        }}
      >
        <MeetingRoomIcon color="secondary" />
      </IconButton> */}

      {/*//*-----------------------------------------------------------------*/}
      {/*//* Room list dialog.                                               */}
      {/*//*-----------------------------------------------------------------*/}
      {/* <Dialog
        open={openRoomDialog}
        onClose={() => {
          setOpenRoomDialog(false);
        }}
        TransitionComponent={Transition}
        keepMounted
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
        aria-describedby="alert-dialog-slide-description"
        scroll="paper"
        PaperProps={{
          sx: {
            width: "80%",
            position: "fixed",
            bottom: 10,
            left: 10,
            m: 0,
          },
        }}
      >
        <BootstrapDialogTitle
          onClose={() => {
            setOpenRoomDialog(false);
          }}
          style={{ cursor: "move" }}
          id="draggable-dialog-title"
        >
          Room List
        </BootstrapDialogTitle>
        <DialogContent dividers={true}>
          <RoomList
            roomList={roomList}
            connectCallFunc={connectCall}
            onClose={() => {
              setOpenRoomDialog(false);
            }}
          />
        </DialogContent>
      </Dialog> */}

      {/*//*-----------------------------------------------------------------*/}
      {/*//* Room title input dialog.                                        */}
      {/*//*-----------------------------------------------------------------*/}
      {/* <Dialog
        open={openRoomTitleInputDialog}
        onClose={() => {
          setOpenRoomTitleInputDialog(false);
        }}
        TransitionComponent={Transition}
        keepMounted
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
        aria-describedby="alert-dialog-slide-description"
        scroll="paper"
        PaperProps={{
          sx: {
            width: "80%",
            position: "fixed",
            bottom: 10,
            left: 10,
            m: 0,
          },
        }}
      >
        <BootstrapDialogTitle
          onClose={() => {
            setOpenRoomTitleInputDialog(false);
          }}
          style={{ cursor: "move" }}
          id="draggable-dialog-title"
        >
          Room Title
        </BootstrapDialogTitle>
        <DialogContent dividers={true}>
          <TextField
            fullWidth
            required
            id="outlined"
            label="Room Title"
            name="roomTitle"
            InputProps={{ style: { fontSize: 12 } }}
            value={roomTitle}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={async () => {
              await remonCall.current.connectCall(roomTitle);
              setOpenRoomTitleInputDialog(false);
            }}
          >
            Connect
          </Button>
        </DialogActions>
      </Dialog> */}

      {/* <RBSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        currentTime={snackbarTime}
      /> */}
    </>
  );
}

export default VideoChat;
