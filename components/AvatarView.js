import React from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";
import * as ThreeVrm from "@pixiv/three-vrm";
import * as STDLIB from "three-stdlib";
import loadable from "@loadable/component";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Backdrop from "@mui/material/Backdrop";
import {
  ScreenPosition,
  Z_INDEX,
  humanFileSize,
} from "@/components/RealBitsUtil";
import HolisticData from "@/components/HolisticData";
const StatsWithNoSSR = loadable.lib(
  () => import("three/examples/jsm/libs/stats.module.js"),
  {
    ssr: false,
  }
);

function AvatarView({
  inputGltfDataUrl,
  getV3dCoreFuncRef,
  v3dCoreLoadedCallback,
  getImageDataUrlFunc,
  getMediaStreamFunc,
  setAvatarPositionFunc,
  showGuideCanvas = false,
  showFrameStats = false,
  useMotionUpdate = true,
  setAvatarExpressionFuncRef,
  setTalkFuncRef,
}) {
  //*---------------------------------------------------------------------------
  //* Constant variables.
  //*---------------------------------------------------------------------------
  const CameraType = {
    perspective: "perspective",
    orthographic: "orthographic",
  };
  const IMAGE_SNAPSHOT_WIDTH = 1024;
  const IMAGE_SNAPSHOT_HEIGHT = 1024;
  const SERVICE_MODE = process.env.NEXT_PUBLIC_SERVICE_MODE;

  //*---------------------------------------------------------------------------
  //* GLTF loading variable.
  //*---------------------------------------------------------------------------
  const [gltfLoadingProgress, setGltfLoadingProgress] = React.useState(0);
  // visibility: hidden or visible
  const [showGltfLoadingProgress, setShowGltfLoadingProgress] =
    React.useState("hidden");
  const isTalkingRef = React.useRef(false);
  const mouthLevelRef = React.useRef(0);

  //*---------------------------------------------------------------------------
  //* Mesh transfomation data.
  //* - rotation, position, and scale
  //*---------------------------------------------------------------------------
  const FRAME_COUNT = 60;

  //*---------------------------------------------------------------------------
  //* Mutable variable with useRef.
  //*---------------------------------------------------------------------------
  const backdropRef = React.useRef();
  const sourceVideoRef = React.useRef();
  const v3dWebRef = React.useRef();
  const v3dCoreRef = React.useRef();
  const rendererRef = React.useRef();
  const sceneRef = React.useRef();
  const deltaRef = React.useRef(0);
  const INTERVAL = React.useRef(1 / FRAME_COUNT);
  const clock = React.useRef();
  const statsLib = React.useRef();
  const currentWindowRatioRef = React.useRef(1);
  const showAvatarOptionRef = React.useRef(true);
  const currentGltfData = React.useRef();
  const currentCanvasPositionRef = React.useRef(ScreenPosition.center);
  const currentAvatarPositionRef = React.useRef(ScreenPosition.center);
  const currentScreenVideoStreamRef = React.useRef();

  //* type: ThreeVrm.VRM
  const currentVrmRef = React.useRef();

  //* OrbitControl variables.
  const orbitControlsRef = React.useRef();
  const ORBIT_CONTROL_ENABLE_DUMPING = true;
  const ORBIT_CONTROL_MIN_DISTANCE = 0.1;
  const ORBIT_CONTROL_MAX_DISTANCE = 100;
  const ORBIT_CONTROL_MIN_AZIMUTH_ANGLE = -Math.PI / 2;
  const ORBIT_CONTROL_MAX_AZIMUTH_ANGLE = Math.PI / 2;
  const ORBIT_CONTROL_MAX_POLAR_ANGLE = Math.PI / 1.8;

  //* OrbitCamera variables.
  const CAMERA_FOV = 35;
  const CAMERA_NEAR = ORBIT_CONTROL_MIN_DISTANCE;
  const CAMERA_FAR = ORBIT_CONTROL_MAX_DISTANCE;
  const orbitCameraRef = React.useRef();
  const currentOrbitCameraTypeRef = React.useRef(CameraType.perspective);
  const currentOrbitCameraPositionXRef = React.useRef(0);
  const currentOrbitCameraPositionYRef = React.useRef(0.8);
  const currentOrbitCameraPositionZRef = React.useRef(0);

  //*---------------------------------------------------------------------------
  //* useRef, useState variables.
  //*---------------------------------------------------------------------------
  const avatarCanvasRef = React.useRef(null);
  const currentAvatarDataUrl = React.useRef();
  const guideCanvasRef = React.useRef();
  const AVATAR_CANVAS_CAPTURE_FRAME_RATE = 20;
  const WHITE_COLOR_HEX = 0xffffff;
  const CIRCULAR_PROGRESS_SIZE = 112;

  async function initializeAudio() {
    let talktime = true;
    let mouththreshold = 10;
    let mouthboost = 10;

    // mic listener - get a value
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then(function (stream) {
        let audioContext = new AudioContext();
        let analyser = audioContext.createAnalyser();
        let microphone = audioContext.createMediaStreamSource(stream);
        let javascriptNode = audioContext.createScriptProcessor(256, 1, 1);

        analyser.smoothingTimeConstant = 0.5;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = function () {
          let array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          let values = 0;

          let length = array.length;
          for (let i = 0; i < length; i++) {
            values += array[i];
          }

          // audio in expressed as one number
          let average = values / length;
          let inputvolume = average;

          // audio in spectrum expressed as array
          // console.log(array.toString());
          // useful for mouth shape variance

          // move the interface slider
          document.getElementById("inputlevel").value = inputvolume;

          // mic based / endless animations (do stuff)

          if (currentVrmRef.current != undefined) {
            //best to be sure

            // talk

            if (talktime == true) {
              // todo: more vowelshapes
              let voweldamp = 53;
              let vowelmin = 12;
              const mouthValue =
                ((average - vowelmin) / voweldamp) * (mouthboost / 10);
              mouthLevelRef.current = mouthValue;
              if (inputvolume > mouththreshold * 2) {
                currentVrmRef.current?.expressionManager?.setValue(
                  ThreeVrm.VRMExpressionPresetName.Aa,
                  mouthValue
                );
              } else {
                currentVrmRef.current?.expressionManager?.setValue(
                  ThreeVrm.VRMExpressionPresetName.Aa,
                  0
                );
              }
            }
          }
        };
      });
  }

  React.useEffect(() => {
    // console.log("call useEffect()");
    // console.log("inputGltfDataUrl: ", inputGltfDataUrl);

    initializeAudio();

    async function initialize() {
      await initializeAvatarContent({
        url: inputGltfDataUrl,
        useMotionUpdate: useMotionUpdate,
      });

      setAvatarPosition({
        canvasPosition: undefined,
        avatarPosition: undefined,
        screenVideoStreamRef: currentScreenVideoStreamRef,
        showAvatarOption: true,
      });

      currentAvatarDataUrl.current = inputGltfDataUrl;
    }

    // console.log("call useEffect()");
    // console.log("AvatarView useEffect inputGltfDataUrl: ", inputGltfDataUrl);
    clock.current = new THREE.Clock();

    if (inputGltfDataUrl !== currentAvatarDataUrl.current) {
      //* Call initialize function if inputGltfDataUrl is new.
      initialize();
    }

    //* Set get image data url and get media stream and set show avatar view function.
    getImageDataUrlFunc.current = getImageDataUrl;
    getMediaStreamFunc.current = getMediaStream;
    setAvatarPositionFunc.current = setAvatarPosition;
    getV3dCoreFuncRef.current = getV3dCoreFunc;
    if (setAvatarExpressionFuncRef) {
      setAvatarExpressionFuncRef.current = setAvatarExpression;
    }
    setTalkFuncRef.current = handleIsTalking;
  }, [
    inputGltfDataUrl,
    getImageDataUrlFunc,
    getMediaStreamFunc,
    setAvatarPositionFunc,
  ]);

  function handleIsTalking(talking) {
    console.log("call handleIsTalking()");
    console.log("talking: ", talking);
    isTalkingRef.current = talking;
  }

  function getV3dCoreFunc() {
    return v3dCoreRef.current;
  }

  function setBackgroundVideo({ canvasPosition, screenVideoStreamRef }) {
    // console.log("screenVideoStreamRef: ", screenVideoStreamRef);
    if (
      screenVideoStreamRef !== undefined &&
      screenVideoStreamRef.current !== undefined &&
      screenVideoStreamRef.current.srcObject !== undefined &&
      screenVideoStreamRef.current.srcObject !== null
    ) {
      //* Set background with stream.
      // console.log("Set background with video.");
      const textureVideoBackground = new THREE.VideoTexture(
        screenVideoStreamRef.current
      );

      //* If video stream is local camera, flip Y axis as mirror.
      if (screenVideoStreamRef.current.id === "localCameraStreamVideo") {
        textureVideoBackground.wrapS = THREE.RepeatWrapping;
        textureVideoBackground.repeat.x = -1;
      }
      textureVideoBackground.format = THREE.RGBAFormat;
      textureVideoBackground.encoding = THREE.sRGBEncoding;
      sceneRef.current.background = textureVideoBackground;
      // console.log("textureVideoBackground: ", textureVideoBackground);
    } else {
      sceneRef.current.background = new THREE.Color(WHITE_COLOR_HEX);
      if (avatarCanvasRef.current) {
        avatarCanvasRef.current.style.border = "";
      }
    }
  }

  function setAvatarPosition({
    canvasPosition,
    avatarPosition,
    screenVideoStreamRef,
    showAvatarOption,
  }) {
    // console.log("call setAvatarPosition()");
    // Keep data for webgl lost event and restore.
    if (canvasPosition !== undefined) {
      currentCanvasPositionRef.current = canvasPosition;
    }
    if (avatarPosition !== undefined) {
      currentAvatarPositionRef.current = avatarPosition;
    }
    if (
      screenVideoStreamRef !== undefined &&
      screenVideoStreamRef.current !== undefined
    ) {
      currentScreenVideoStreamRef.current = screenVideoStreamRef.current;
    }

    //* TODO: Block for a while.
    // setBackgroundVideo({
    //   canvasPosition: currentCanvasPositionRef.current,
    //   screenVideoStreamRef: screenVideoStreamRef,
    // });

    if (showAvatarOption === false) {
      //* Remove the found mesh to sceneRef.
      showAvatarOptionRef.current = false;
      sceneRef.current.clear();
    } else {
      if (showAvatarOptionRef.current === false) {
        //* Add the found mesh to sceneRef.
        showAvatarOptionRef.current = true;

        //* Recover scene mesh objects.
        sceneRef.current.add(currentVrmRef.current.scene);

        //* Create light for vrm model.
        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1.0, 1.0, 1.0).normalize();
        sceneRef.current.add(light);
      }
    }

    makePosition({
      canvasPosition: currentCanvasPositionRef.current,
      avatarPosition: currentAvatarPositionRef.current,
    });
  }

  function makePosition({ canvasPosition, avatarPosition }) {
    // console.log("call makePosition()");
    // console.log(
    //   `canvasPosition: ${canvasPosition}, avatarPosition: ${avatarPosition}`
    // );

    switch (true) {
      case canvasPosition === ScreenPosition.center &&
        avatarPosition === ScreenPosition.center:
      default:
        avatarCanvasRef.current.style.position = "absolute";
        avatarCanvasRef.current.style.zIndex = Z_INDEX.avatarCanvasCenter;
        avatarCanvasRef.current.style.width = "100%";
        avatarCanvasRef.current.style.height = "100%";
        avatarCanvasRef.current.style.right = "0px";
        avatarCanvasRef.current.style.top = "0px";
        break;

      case canvasPosition === ScreenPosition.rightTop &&
        avatarPosition === ScreenPosition.center:
        avatarCanvasRef.current.style.position = "absolute";
        avatarCanvasRef.current.style.zIndex = 100;
        avatarCanvasRef.current.style.width = "25%";
        avatarCanvasRef.current.style.height = "25%";
        avatarCanvasRef.current.style.right = "20px";
        avatarCanvasRef.current.style.top = "20px";
        avatarCanvasRef.current.style.boxShadow = "10px 10px 20px 1px grey";
        break;
    }
  }

  function initializeStats({ default: inputStatsLib }) {
    // console.log("initializeStats inputStatsLib: ", inputStatsLib);

    if (showFrameStats === true) {
      statsLib.current = new inputStatsLib();
      document.body.appendChild(statsLib.current.dom);
    }
  }

  function getImageDataUrl() {
    // console.log("call getImageDataUrl()");

    return avatarCanvasRef.current.toDataURL();

    //* Make a temporary canvas for a static size.
    const resizedCanvas = document.createElement("canvas");
    // console.log("resizedCanvas: ", resizedCanvas);
    resizedCanvas.width = IMAGE_SNAPSHOT_WIDTH;
    resizedCanvas.height =
      (resizedCanvas.width * (window.innerHeight || IMAGE_SNAPSHOT_WIDTH)) /
      (window.innerWidth || IMAGE_SNAPSHOT_HEIGHT);
    const resizedContext = resizedCanvas.getContext("2d");

    //* Get an original canvas.
    const avatarCanvasElement = document.getElementById("avatarCanvas");
    // console.log("avatarCanvasElement: ", avatarCanvasElement);

    resizedContext.drawImage(
      // avatarCanvasElement,
      avatarCanvasRef.current,
      0,
      0,
      resizedCanvas.width,
      resizedCanvas.height
    );
    const myResizedData = resizedCanvas.toDataURL();
    // console.log("myResizedData: ", myResizedData);

    // return avatarCanvasElement.toDataURL();
    return myResizedData;
  }

  function resetExpressions() {
    const vrmManager = v3dCoreRef.current.getVRMManagerByURI("default.vrm");
    vrmManager.morphing("Neutral", 0);
    vrmManager.morphing("Happy", 0);
    vrmManager.morphing("Joy", 0);
    vrmManager.morphing("Angry", 0);
    vrmManager.morphing("Sad", 0);
    vrmManager.morphing("Sorrow", 0);
    vrmManager.morphing("Relaxed", 0);
    vrmManager.morphing("Fun", 0);
    vrmManager.morphing("Surprised", 0);
  }

  function setAvatarExpression({ expression }) {
    // console.log("call setAvatarExpression()");
    // console.log("expression: ", expression);
    // console.log("typeof expression: ", typeof expression);

    if (v3dCoreRef.current) {
      // console.log("v3dCoreRef.current: ", v3dCoreRef.current);
      const vrmManager = v3dCoreRef.current.getVRMManagerByURI("default.vrm");
      // console.log("vrmManager: ", vrmManager);

      // Update expression
      resetExpressions();
      switch (expression) {
        case "Neutral": // fall through
        default:
          vrmManager.morphing("Neutral", 1);
          break;

        case "Happy":
          vrmManager.morphing("Happy", 1);
          vrmManager.morphing("Joy", 1);
          break;

        case "Joy":
          vrmManager.morphing("Joy", 1);
          break;

        case "Angry":
          vrmManager.morphing("Angry", 1);
          break;

        case "Sad":
          vrmManager.morphing("Sad", 1);
          vrmManager.morphing("Sorrow", 1);
          break;

        case "Sorrow":
          vrmManager.morphing("Sorrow", 1);
          break;

        case "Relaxed":
          vrmManager.morphing("Relaxed", 1);
          vrmManager.morphing("Fun", 1);
          break;

        case "Fun":
          vrmManager.morphing("Fun", 1);
          break;

        case "Surprised":
          vrmManager.morphing("Surprised", 1);
          break;
      }
    }
  }

  //*---------------------------------------------------------------------------
  //* Initialize data.
  //*---------------------------------------------------------------------------
  async function initializeAvatarContent({ url, useMotionUpdate }) {
    // console.log("call initializeAvatarContent()");
    // console.log("v3dWebRef.current: ", v3dWebRef.current);
    // console.log("url: ", url);

    //* TODO: Block the usage of Three.js library.
    if (SERVICE_MODE === "avame") {
      makeScene();
      await loadGltf({ url });
      return;
    }

    //* If we already drew model, just change the model url.
    if (v3dWebRef.current) {
      //* TODO: After two time chagne, some error will happen.
      // v3dWebRef.current.vrmFile = url;
      // return;

      //* Close all instances.
      v3dWebRef.current.close();
    }

    //* Use v3d-web and v3d-core with Babylon.js library.
    const V3DWebLibrary = await import("v3d-web-realbits/dist/src");
    // console.log("V3DWebLibrary: ", V3DWebLibrary);
    v3dWebRef.current = new V3DWebLibrary.V3DWeb(
      url,
      sourceVideoRef.current,
      avatarCanvasRef.current,
      guideCanvasRef.current,
      null,
      {
        locateFile: (file) => {
          // console.log("file: ", file);
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`;
          // return `/holistic/${file}`;
        },
      },
      backdropRef.current,
      //* Flag for whether or not to use holistic motion capture.
      useMotionUpdate,
      //* Use a face mesh option in case of mobile case.
      isMobile,
      () => {
        v3dCoreRef.current = v3dWebRef.current.v3DCore;
        if (v3dCoreLoadedCallback) {
          v3dCoreLoadedCallback();
        }

        //* Add window resize event function.
        window.addEventListener("resize", () => {
          // console.log("-- resize event");
        });
      }
    );
  }

  //*---------------------------------------------------------------------------
  //* Make scene with three js.
  //*---------------------------------------------------------------------------
  function makeScene() {
    //* Set window ratio.
    if (window.innerWidth !== 0) {
      currentWindowRatioRef.current = window.innerWidth / window.innerHeight;
    } else {
      currentWindowRatioRef.current = 1;
    }
    // console.log("window.innerWidth / 200: ", window.innerWidth / 200);
    // console.log("window.innerHeight / 200: ", window.innerHeight / 200);
    // console.log(
    //   "currentWindowRatioRef.current: ",
    //   currentWindowRatioRef.current
    // );

    //* Set camera type.
    if (currentOrbitCameraTypeRef.current === CameraType.perspective) {
      // console.log("set camera perpective.");
      orbitCameraRef.current = new THREE.PerspectiveCamera(
        CAMERA_FOV,
        currentWindowRatioRef.current,
        CAMERA_NEAR,
        CAMERA_FAR
      );
    } else if (currentOrbitCameraTypeRef.current === CameraType.orthographic) {
      // console.log("set camera orthogonal.");
      orbitCameraRef.current = new THREE.OrthographicCamera(
        -1,
        1,
        currentWindowRatioRef.current,
        -1 * currentWindowRatioRef.current,
        CAMERA_NEAR,
        CAMERA_FAR
      );
    } else {
      throw new Error(
        `Non available camera type: ${currentOrbitCameraTypeRef.current}`
      );
    }

    //* Create scene.
    sceneRef.current = new THREE.Scene();

    //* Create webgl renderer.
    rendererRef.current = new THREE.WebGLRenderer({
      antialias: true,
      canvas: avatarCanvasRef.current,
      preserveDrawingBuffer: true,
      alpha: true,
    });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    // rendererRef.current.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current.outputEncoding = THREE.sRGBEncoding;

    //* Register window resize event.
    window.addEventListener("resize", () => {
      // console.log("-- resize event");

      //* Get window ratio.
      if (window.innerWidth !== 0) {
        currentWindowRatioRef.current = window.innerWidth / window.innerHeight;
      } else {
        currentWindowRatioRef.current = 1;
      }

      //* Get camera type.
      if (currentOrbitCameraTypeRef.current === CameraType.perspective) {
        orbitCameraRef.current.aspect = currentWindowRatioRef.current;
      } else if (
        currentOrbitCameraTypeRef.current === CameraType.orthographic
      ) {
        orbitCameraRef.current.left = -1;
        orbitCameraRef.current.right = 1;
        orbitCameraRef.current.top = currentWindowRatioRef.current;
        orbitCameraRef.current.bottom = -1 * currentWindowRatioRef.current;
      }

      //* Update view matrix.
      orbitCameraRef.current.updateProjectionMatrix();

      //* Set renderer size and pixel ratio.
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.setPixelRatio(window.devicePixelRatio);

      //* Set avatar position.
      setAvatarPosition({
        canvasPosition: currentCanvasPositionRef.current,
        avatarPosition: currentAvatarPositionRef.current,
        screenVideoStreamRef: currentScreenVideoStreamRef,
        showAvatarOption: true,
      });
    });

    //* Register webglcontextlost event.
    //* https://stackoverflow.com/questions/61020416/how-to-handle-webgl-context-lost-webgl-errors-more-gracefully-in-pixijs
    avatarCanvasRef.current.addEventListener("webglcontextlost", function () {
      // console.log("webglcontextlost event");
    });

    //* Register webglcontextrestored event.
    //* https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextrestored_event
    avatarCanvasRef.current.addEventListener(
      "webglcontextrestored",
      async function () {
        //* Remove avatarscene.
        // console.log("webglcontextrestored event");
        sceneRef.current.clear();
        clock.current = new THREE.Clock();

        //* Initialize avatar scene.
        await initializeAvatarContent({ url: currentAvatarDataUrl.current });

        //* Set avatar position.
        setAvatarPosition({
          canvasPosition: currentCanvasPositionRef.current,
          avatarPosition: currentAvatarPositionRef.current,
          screenVideoStreamRef: currentScreenVideoStreamRef,
          showAvatarOption: true,
        });
      }
    );

    //* Make environment instance.
    const environment = new STDLIB.RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current);
    sceneRef.current.environment =
      pmremGenerator.fromScene(environment).texture;

    //* TODO: Make control instance.
    // orbitControlsRef.current = new STDLIB.OrbitControls(
    //   orbitCameraRef.current,
    //   rendererRef.current.domElement
    // );
    // orbitControlsRef.current.mouseButtons = {
    //   LEFT: THREE.MOUSE.RIGHT,
    //   MIDDLE: THREE.MOUSE.PAN,
    //   RIGHT: THREE.MOUSE.ROTATE,
    // };
    // orbitControlsRef.current.enableDamping = ORBIT_CONTROL_ENABLE_DUMPING;
    // orbitControlsRef.current.minDistance = ORBIT_CONTROL_MIN_DISTANCE;
    // orbitControlsRef.current.maxDistance = ORBIT_CONTROL_MAX_DISTANCE;
    // orbitControlsRef.current.minAzimuthAngle = ORBIT_CONTROL_MIN_AZIMUTH_ANGLE;
    // orbitControlsRef.current.maxAzimuthAngle = ORBIT_CONTROL_MAX_AZIMUTH_ANGLE;
    // orbitControlsRef.current.maxPolarAngle = ORBIT_CONTROL_MAX_POLAR_ANGLE;

    // orbitControlsRef.current.target.set(
    //   currentOrbitCameraPositionXRef.current,
    //   currentOrbitCameraPositionYRef.current,
    //   currentOrbitCameraPositionZRef.current
    // );
  }

  async function loadGltf({ url }) {
    // console.log("call loadGltf()");
    // console.log("url: ", url);

    //* Make ktx loader instance.
    const ktx2Loader = new STDLIB.KTX2Loader()
      .setTranscoderPath("js/libs/basis/")
      .detectSupport(rendererRef.current);

    //* Make gltf loader instance.
    const gltfLoader = new STDLIB.GLTFLoader()
      .setKTX2Loader(ktx2Loader)
      .setMeshoptDecoder(STDLIB.MeshoptDecoder);

    //* Show gltf loading circle.
    // console.log("Loading visible when gltf loading started.");
    setShowGltfLoadingProgress("visible");

    //* Register VRM plugin
    gltfLoader.register((parser) => {
      return new ThreeVrm.VRMLoaderPlugin(parser);
    });

    //* Load gltf data.
    gltfLoader.load(
      url,
      function (gltf) {
        console.log("gltf.userData.vrm: ", gltf.userData.vrm);

        if (gltf.userData.vrm) {
          currentVrmRef.current = gltf.userData.vrm;
          // console.log("currentVrmRef.current: ", currentVrmRef.current);
          ThreeVrm.VRMUtils.removeUnnecessaryJoints(gltf.scene);

          //* Rotate model 180deg to face camera
          // https://github.com/pixiv/three-vrm/blob/dev/docs/migration-guide-1.0.md
          // ThreeVrm.VRMUtils.rotateVRM0(currentVrmRef.current);

          //* Add vrm model to scene.
          // currentVrmRef.current.humanoid.autoUpdateHumanBones = false;
          sceneRef.current.add(currentVrmRef.current.scene);
          // console.log(
          //   "currentVrmRef.current.scene: ",
          //   currentVrmRef.current.scene
          // );

          //* Create light.
          const light = new THREE.DirectionalLight(0xffffff);
          light.position.set(1.0, 1.0, 1.0).normalize();
          sceneRef.current.add(light);

          // const expressionManager = currentVrmRef.current.expressionManager;
          // console.log("expressionManager: ", expressionManager);
          // const expressionName = expressionManager.getExpression(
          //   ThreeVrm.VRMExpressionPresetName.BlinkLeft
          // );
          // console.log("expressionName: ", expressionName);
          // console.log("expressions: ", expressionManager.expressions);

          //* Cancel T-pose.
          currentVrmRef.current.humanoid.getNormalizedBoneNode(
            ThreeVrm.VRMHumanBoneName["RightUpperArm"]
          ).rotation.z = 250;

          currentVrmRef.current.humanoid.getNormalizedBoneNode(
            ThreeVrm.VRMHumanBoneName["RightLowerArm"]
          ).rotation.z = -0.2;

          currentVrmRef.current.humanoid.getNormalizedBoneNode(
            ThreeVrm.VRMHumanBoneName["LeftUpperArm"]
          ).rotation.z = -250;

          currentVrmRef.current.humanoid.getNormalizedBoneNode(
            ThreeVrm.VRMHumanBoneName["LeftLowerArm"]
          ).rotation.z = 0.2;
        }

        //* Keep gltf data to loadedGltfData variable.
        currentGltfData.current = gltf;

        //* Set animation loop.
        rendererRef.current.setAnimationLoop(() => {
          deltaRef.current += clock.current.getDelta();
          // console.log("deltaRef.current: ", deltaRef.current);
          // console.log("INTERVAL.current: ", INTERVAL.current);

          if (deltaRef.current > INTERVAL.current) {
            // console.log("render");
            renderAvatar();
            deltaRef.current = deltaRef.current % INTERVAL.current;
          }

          if (showFrameStats === true) {
            //* Update stat.
            statsLib.current.update();
          }
        });

        //* Set camera setting.
        adjustCamera({ gltf: currentGltfData.current });

        console.log("Loading hidden when gltf loaidng finished.");
        setShowGltfLoadingProgress("hidden");
      },
      function (xhr) {
        if (xhr.lengthComputable === true && xhr.total !== 0) {
          const progressPercent = Math.round((xhr.loaded / xhr.total) * 100);
          // console.log(`${progressPercent}% loaded`);
          setGltfLoadingProgress(progressPercent);
        } else {
          // console.log(humanFileSize(xhr.loaded) + " loaded");
        }
      },
      function (error) {
        console.error(error);
        // console.log("Loading hidden when error happened.");
        setShowGltfLoadingProgress("hidden");
      }
    );
  }

  function adjustCamera({ gltf }) {
    // console.log("call adjustCamera()");
    // console.log("gltf: ", gltf);

    if (gltf.cameras.length > 0) {
      const camera = gltf.cameras[0];
      // console.log("camera: ", camera);
      // console.log("orbitCameraRef.current: ", orbitCameraRef.current);

      orbitCameraRef.current.ratio = camera.aspect;
      orbitCameraRef.current.fov = camera.fov;
      orbitCameraRef.current.near = camera.near;
      orbitCameraRef.current.far = camera.far;
      orbitCameraRef.current.position.set(
        camera.position.x,
        camera.position.y,
        camera.position.z
      );
      orbitCameraRef.current.setRotationFromQuaternion(camera.quaternion);

      // console.log("orbitCameraRef.current: ", orbitCameraRef.current);
      orbitCameraRef.current.updateProjectionMatrix();
    }
  }

  //*---------------------------------------------------------------------------
  //* Make stream.
  //*---------------------------------------------------------------------------
  async function getMediaStream() {
    //* Extract mediaStream:
    let originalUserMedia;
    try {
      originalUserMedia = await navigator.mediaDevices.getUserMedia({
        audio: true,
        // In mobile, this option makes errors.
        // video: { width: 640, height: 360 },
        video: true,
      });

      try {
        //* Extract audio track:
        const audioTrack = originalUserMedia.getAudioTracks()[0];

        // console.log("avatarCanvasRef.current: ", avatarCanvasRef.current);
        //* Get video from canvas:
        const canvasVideoStream = avatarCanvasRef.current.captureStream(
          AVATAR_CANVAS_CAPTURE_FRAME_RATE
        );
        const canvasVideoTrack = canvasVideoStream.getVideoTracks()[0];

        //* Composite the new mediastream:
        let stream;
        if (audioTrack) {
          stream = new MediaStream([canvasVideoTrack, audioTrack]);
        } else {
          stream = new MediaStream([canvasVideoTrack]);
        }
        return stream;
      } catch (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }
  }

  //*---------------------------------------------------------------------------
  //* Render data.
  //*---------------------------------------------------------------------------
  function renderAvatar() {
    // console.log("call renderAvatar()");

    //* TODO: Make animation.
    if (isTalkingRef.current) {
      currentVrmRef.current.expressionManager.setValue(
        ThreeVrm.VRMExpressionPresetName.Aa,
        1
      );
    } else {
      currentVrmRef.current.expressionManager.setValue(
        ThreeVrm.VRMExpressionPresetName.Aa,
        0
      );
    }
    currentVrmRef.current.expressionManager.setValue(
      ThreeVrm.VRMExpressionPresetName.Aa,
      mouthLevelRef.current
    );

    //* Update vrm.
    if (currentVrmRef.current) {
      currentVrmRef.current.update(deltaRef.current);
    }

    //* Update scene and camera.
    rendererRef.current.render(sceneRef.current, orbitCameraRef.current);

    //* Update control.
    // orbitControlsRef.current.update();
  }

  // Z-index
  // avatar canvas : 10
  // righ-top avatar canvas : 100
  // button : 100
  // dialog : > 100
  //* TODO: Set the size of avatarCanvas.
  return (
    <>
      {/*//*-----------------------------------------------------------------*/}
      {/*//* Video source for alter core avatar library.                     */}
      {/*//*-----------------------------------------------------------------*/}
      <video
        id="sourceVideo"
        ref={sourceVideoRef}
        style={{ display: "none" }}
        autoPlay={true}
        playsInline={true}
        muted={true}
        loop={true}
        preload={"auto"}
        // width="1280px"
        // height="720px"
      ></video>

      {/*//*-----------------------------------------------------------------*/}
      {/*//* Canvas for avatar of GLTF format.                               */}
      {/*//*-----------------------------------------------------------------*/}
      <canvas
        id="avatarCanvas"
        className="avatarCanvas"
        ref={avatarCanvasRef}
      />
      <StatsWithNoSSR ref={initializeStats}></StatsWithNoSSR>
      {SERVICE_MODE !== "avame" && (
        <div ref={backdropRef}>
          <Backdrop open={true} sx={{ color: "#fff", zIndex: 20 }}>
            <CircularProgress color="inherit" />
          </Backdrop>
        </div>
      )}

      {showGuideCanvas ? (
        <Box
          width="100px"
          height="100px"
          border={0}
          borderColor="primary.main"
          sx={{
            top: 0,
            right: 100,
            zIndex: Z_INDEX.dialog,
            position: "absolute",
            display: "flex",
            // transform: "scale(-1, 1)",
          }}
        >
          <canvas id="guideCanvas" ref={guideCanvasRef} />
        </Box>
      ) : null}

      <input
        type="range"
        min="0"
        max="100"
        value="10"
        class="slider"
        id="inputlevel"
      />

      {/* <HolisticData currentVrmRef={currentVrmRef} /> */}

      {/*//*-----------------------------------------------------------------*/}
      {/*//* GLTF loading progress circle.                                   */}
      {/*//*-----------------------------------------------------------------*/}
      <Box
        visibility={showGltfLoadingProgress}
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          zIndex: Z_INDEX.loader,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress
          variant="determinate"
          value={gltfLoadingProgress}
          size={CIRCULAR_PROGRESS_SIZE}
        />
      </Box>
      <Box
        visibility={showGltfLoadingProgress}
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          zIndex: Z_INDEX.loader,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h5" component="div" color="text.secondary">
          {`${gltfLoadingProgress}%`}
        </Typography>
      </Box>
    </>
  );
}

export default AvatarView;
