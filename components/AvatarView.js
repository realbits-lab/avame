import React from "react";
import * as THREE from "three";
import * as ThreeVrm from "@pixiv/three-vrm";
import * as STDLIB from "three-stdlib";
import loadable from "@loadable/component";
import { Box, CircularProgress, Typography } from "@mui/material";
import { ScreenPosition, Z_INDEX } from "./RealBitsUtil";
import { humanFileSize } from "rent-market";

const Stats = loadable.lib(
  () => import("three/examples/jsm/libs/stats.module.js"),
  {
    ssr: false,
  }
);

import createHolisticData from "./createHolisticData";
const HolisticTrackData = loadable.lib(() => import("./createHolisticData"), {
  ssr: false,
});

function AvatarView({
  gltfDataUrl,
  getImageDataUrlFunc,
  getMediaStreamFunc,
  setTransformAvatarFunc,
}) {
  const CameraType = {
    perspective: "perspective",
    orthographic: "orthographic",
  };

  //----------------------------------------------------------------------------
  // GLTF loading variable.
  //----------------------------------------------------------------------------
  const [gltfLoadingProgress, setGltfLoadingProgress] = React.useState(0);
  // visibility: hidden or visible
  const [showGltfLoadingProgress, setShowGltfLoadingProgress] =
    React.useState("hidden");

  //----------------------------------------------------------------------------
  // Mesh transfomation data.
  // - rotation, position, and scale
  //----------------------------------------------------------------------------
  const TOTAL_MORPH_COUNT = 42;
  const INTERVAL_FRAME_COUNT = 30;
  const [showAvatarView, setShowAvatarView] = React.useState(true);

  //----------------------------------------------------------------------------
  // Mutable variable with useRef.
  //----------------------------------------------------------------------------
  const rendererRef = React.useRef();
  const sceneRef = React.useRef();
  const isIdleStatus = React.useRef(false);
  const idleStatusTimer = React.useRef();
  const deltaRef = React.useRef(0);
  const avatarScale = React.useRef(0);
  const FACE_DETECT_THRESHOLD = React.useRef(0.5);
  const INTERVAL = React.useRef(1 / INTERVAL_FRAME_COUNT);
  const clock = React.useRef();
  const avatarInfluence = React.useRef(new Float32Array(TOTAL_MORPH_COUNT));
  const avatarQuartenionArray = React.useRef(new Float32Array(4));
  const avatarPosition = React.useRef(new Float32Array(3));
  const alterCoreLib = React.useRef();
  const statsLib = React.useRef();
  const currentWindowRatioRef = React.useRef(1);
  const showAvatarOptionRef = React.useRef(true);
  const loadedGltftData = React.useRef();
  const currentCanvasPositionRef = React.useRef(ScreenPosition.center);
  const currentAvatarPositionRef = React.useRef(ScreenPosition.center);
  const currentScreenVideoStreamRef = React.useRef();

  // type: ThreeVrm.VRM
  const currentVrmRef = React.useRef();

  // OrbitControl variables.
  const orbitControlsRef = React.useRef();
  const ORBIT_CONTROL_ENABLE_DUMPING = true;
  const ORBIT_CONTROL_MIN_DISTANCE = 0.1;
  const ORBIT_CONTROL_MAX_DISTANCE = 1000;
  const ORBIT_CONTROL_MIN_AZIMUTH_ANGLE = -Math.PI / 2;
  const ORBIT_CONTROL_MAX_AZIMUTH_ANGLE = Math.PI / 2;
  const ORBIT_CONTROL_MAX_POLAR_ANGLE = Math.PI / 1.8;

  // OrbitCamera variables.
  const CAMERA_FOV = 35;
  const CAMERA_NEAR = ORBIT_CONTROL_MIN_DISTANCE;
  const CAMERA_FAR = ORBIT_CONTROL_MAX_DISTANCE;
  const orbitCameraRef = React.useRef();
  // TODO: Test for vrm.
  const currentOrbitCameraTypeRef = React.useRef(CameraType.perspective);
  // const currentOrbitCameraTypeRef = React.useRef(CameraType.orthographic);
  const currentOrbitCameraPositionXRef = React.useRef(0);
  const currentOrbitCameraPositionYRef = React.useRef(1.4);
  const currentOrbitCameraPositionZRef = React.useRef(5.0);

  // Guide canvas element.
  const [showGuideCanvas, setShowGuideCanvas] = React.useState(true);

  const defaultMeshArray = [
    "top",
    "hair",
    "face",
    "side",
    "middle",
    "bottom",
    "eye",
    "eye_left",
    "eye_right",
    "eyelid_left",
    "eyelid_right",
    "head",
    "eyebrow",
    "eyeball",
    "brow",
    "pupil",
    "teeth",
    "tongue",
    "eye_W",
    "eye_B",
    // "back",
    // For testing.
    "glass",
    "earring",
    "main_skin",
    "Teeth_Lower_",
    "Teeth_Upper",
    "Tongue",
    "Eye_brow",
    "Hair",
    "Eyes",
    "Head",
  ];
  // For testing.
  const HEAD_MESH_NAME = "head";

  //----------------------------------------------------------------------------
  // useRef, useState variables.
  //----------------------------------------------------------------------------
  const morphMeshArray = React.useRef([]);
  const meshArray = React.useRef([]);
  const AVATAR_SCALE = React.useRef(5);
  const AVATAR_MOVE_POSITION = React.useRef([0, 0, 0]);
  const AVATAR_POSITION_SCALE = React.useRef(2);
  const avatarCanvas = React.useRef(null);
  const currentAvatarDataUrl = React.useRef();
  const guideCanvasRef = React.useRef();
  const AVATAR_CANVAS_CAPTURE_FRAME_RATE = 20;
  const WHITE_COLOR_HEX = 0xffffff;
  const CIRCULAR_PROGRESS_SIZE = 112;
  const isFirstCall = React.useRef(true);

  React.useEffect(() => {
    // console.log("call useEffect()");
    // console.log("AvatarView useEffect gltfDataUrl: ", gltfDataUrl);
    clock.current = new THREE.Clock();

    if (gltfDataUrl !== currentAvatarDataUrl.current) {
      // Call initialize function if gltfDataUrl is new.
      initializeContent(gltfDataUrl).then(() => {
        transformAvatar({
          canvasPosition: undefined,
          avatarPosition: undefined,
          screenVideoStreamRef: currentScreenVideoStreamRef,
          showAvatarOption: true,
        });
      });
      currentAvatarDataUrl.current = gltfDataUrl;
    }

    // Set get image data url and get media stream and set show avatar view function.
    getImageDataUrlFunc.current = getImageDataUrl;
    getMediaStreamFunc.current = getMediaStream;
    setTransformAvatarFunc.current = transformAvatar;
  }, [
    gltfDataUrl,
    getImageDataUrlFunc,
    getMediaStreamFunc,
    setTransformAvatarFunc,
  ]);

  React.useEffect(() => {
    // console.log("call useEffect()");

    if (isFirstCall.current === true) {
      // * Holistic function should be called only once.
      isFirstCall.current = false;

      const initialize = async () => {
        const sourceVideoElement = document.getElementById("sourceVideo");
        const guideCanvasElement = document.getElementById("guideCanvas");
        await createHolisticData(
          currentVrmRef,
          sourceVideoElement,
          guideCanvasElement
        );
      };

      initialize();
    }
  }, []);

  const setBackgroundVideo = ({ canvasPosition, screenVideoStreamRef }) => {
    // console.log("screenVideoStreamRef: ", screenVideoStreamRef);
    if (
      screenVideoStreamRef !== undefined &&
      screenVideoStreamRef.current !== undefined &&
      screenVideoStreamRef.current.srcObject !== undefined &&
      screenVideoStreamRef.current.srcObject !== null
    ) {
      // Set background with stream.
      // console.log("Set background with video.");
      const textureVideoBackground = new THREE.VideoTexture(
        screenVideoStreamRef.current
      );

      // If video stream is local camera, flip Y axis as mirror.
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
      avatarCanvas.current.style.border = "";
    }
  };

  function transformAvatar({
    canvasPosition,
    avatarPosition,
    screenVideoStreamRef,
    showAvatarOption,
  }) {
    // console.log("call transformAvatar()");
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

    setBackgroundVideo({
      canvasPosition: currentCanvasPositionRef.current,
      screenVideoStreamRef: screenVideoStreamRef,
    });

    if (showAvatarOption === false) {
      // Remove the found mesh to sceneRef.
      showAvatarOptionRef.current = false;
      sceneRef.current.clear();
    } else {
      if (showAvatarOptionRef.current === false) {
        // Add the found mesh to sceneRef.
        showAvatarOptionRef.current = true;

        // TODO: Remove later.
        meshArray.current.forEach((element) => {
          sceneRef.current.add(element);
        });
        sceneRef.current.add(currentVrmRef.current.scene);

        // Create light for vrm model.
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
        avatarCanvas.current.style.position = "absolute";
        avatarCanvas.current.style.zIndex = Z_INDEX.avatarCanvasCenter;
        avatarCanvas.current.style.width = "100%";
        avatarCanvas.current.style.height = "100%";
        avatarCanvas.current.style.right = "0px";
        avatarCanvas.current.style.top = "0px";

        orbitCameraRef.current.position.set(
          currentOrbitCameraPositionXRef.current,
          currentOrbitCameraPositionYRef.current,
          currentOrbitCameraPositionZRef.current
        );
        setAvatarScale({
          // For perspective camera.
          // scale: 5,
          // positionScale: (CAMERA_NEAR + CAMERA_Z_POSITION) * 2,
          scale: 1,
          positionScale: 1,
          position: [0, 0, 0],
        });
        break;

      case canvasPosition === ScreenPosition.rightTop &&
        avatarPosition === ScreenPosition.center:
        avatarCanvas.current.style.position = "absolute";
        avatarCanvas.current.style.zIndex = 100;
        avatarCanvas.current.style.width = "25%";
        avatarCanvas.current.style.height = "25%";
        avatarCanvas.current.style.right = "20px";
        avatarCanvas.current.style.top = "20px";
        avatarCanvas.current.style.boxShadow = "10px 10px 20px 1px grey";

        orbitCameraRef.current.position.set(
          currentOrbitCameraPositionXRef.current,
          currentOrbitCameraPositionYRef.current,
          currentOrbitCameraPositionZRef.current
        );
        setAvatarScale({
          // For perspective camera.
          // scale: 5,
          // positionScale: (CAMERA_NEAR + CAMERA_Z_POSITION) * 2,
          scale: 1,
          positionScale: 1,
          position: [0, 0, 0],
        });
        break;
    }
  }

  function initializeStats({ default: inputStatsLib }) {
    // console.log("initializeStats inputStatsLib: ", inputStatsLib);
    statsLib.current = new inputStatsLib();
    // document.body.appendChild(statsLib.current.dom);
  }

  const initializeHolisticTrackData = async ({
    default: createHolisticData,
  }) => {
    console.log(
      "initializeHolisticTrackData createHolisticData: ",
      createHolisticData
    );
    const sourceVideoElement = document.getElementById("sourceVideo");
    const guideCanvasElement = document.getElementById("guideCanvas");
    await createHolisticData(
      currentVrmRef,
      sourceVideoElement,
      guideCanvasElement
    );
  };

  function setInterval(interval) {
    INTERVAL.current = interval;
  }

  function getImageDataUrl() {
    let avatarCanvasElement = document.getElementById("avatarCanvas");
    return avatarCanvasElement.toDataURL();
  }

  //----------------------------------------------------------------------------
  // Initialize data.
  //----------------------------------------------------------------------------
  async function initializeContent(url) {
    console.log("initializeContent function url: ", url);
    makeContentInstance();
    await loadGLTF(url);
  }

  //----------------------------------------------------------------------------
  // Make instances.
  //----------------------------------------------------------------------------
  function makeContentInstance() {
    // 1. Make camera instance.
    // Set [-1, 1] range.
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

    orbitCameraRef.current.position.set(
      currentOrbitCameraPositionXRef.current,
      currentOrbitCameraPositionYRef.current,
      currentOrbitCameraPositionZRef.current
    );

    // 2. Make sceneRef instance.
    sceneRef.current = new THREE.Scene();

    // 3. Make rendererRef instance.
    rendererRef.current = new THREE.WebGLRenderer({
      antialias: true,
      canvas: avatarCanvas.current,
      preserveDrawingBuffer: true,
      alpha: true,
    });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    // TODO: Test for vrm.
    // rendererRef.current.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current.outputEncoding = THREE.sRGBEncoding;

    // 4. Add resize event listener.
    window.addEventListener("resize", () => {
      // console.log("-- resize event");

      // 1. Get current window ratio.
      if (window.innerWidth !== 0) {
        currentWindowRatioRef.current = window.innerWidth / window.innerHeight;
      } else {
        currentWindowRatioRef.current = 1;
      }

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

      orbitCameraRef.current.updateProjectionMatrix();

      // 2. Set renderer configuration of size and pixel ratio.
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.setPixelRatio(window.devicePixelRatio);

      // 3. Redraw avatar.
      transformAvatar({
        canvasPosition: currentCanvasPositionRef.current,
        avatarPosition: currentAvatarPositionRef.current,
        screenVideoStreamRef: currentScreenVideoStreamRef,
        showAvatarOption: true,
      });
    });

    // https://stackoverflow.com/questions/61020416/how-to-handle-webgl-context-lost-webgl-errors-more-gracefully-in-pixijs
    avatarCanvas.current.addEventListener("webglcontextlost", () => {
      // console.log("webglcontextlost event");
    });

    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextrestored_event
    avatarCanvas.current.addEventListener("webglcontextrestored", () => {
      // Re-initialize.
      // console.log("webglcontextrestored event");
      sceneRef.current.clear();
      clock.current = new THREE.Clock();
      initializeContent(currentAvatarDataUrl.current).then(() => {
        transformAvatar({
          canvasPosition: currentCanvasPositionRef.current,
          avatarPosition: currentAvatarPositionRef.current,
          screenVideoStreamRef: currentScreenVideoStreamRef,
          showAvatarOption: true,
        });
      });
    });

    // 5. Make environment instance.
    const environment = new STDLIB.RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current);
    sceneRef.current.environment =
      pmremGenerator.fromScene(environment).texture;

    // 6. Make control instance.
    orbitControlsRef.current = new STDLIB.OrbitControls(
      orbitCameraRef.current,
      rendererRef.current.domElement
    );
    orbitControlsRef.current.mouseButtons = {
      LEFT: THREE.MOUSE.RIGHT,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    orbitControlsRef.current.enableDamping = ORBIT_CONTROL_ENABLE_DUMPING;
    orbitControlsRef.current.minDistance = ORBIT_CONTROL_MIN_DISTANCE;
    orbitControlsRef.current.maxDistance = ORBIT_CONTROL_MAX_DISTANCE;
    orbitControlsRef.current.minAzimuthAngle = ORBIT_CONTROL_MIN_AZIMUTH_ANGLE;
    orbitControlsRef.current.maxAzimuthAngle = ORBIT_CONTROL_MAX_AZIMUTH_ANGLE;
    orbitControlsRef.current.maxPolarAngle = ORBIT_CONTROL_MAX_POLAR_ANGLE;
    orbitControlsRef.current.target.set(
      0,
      currentOrbitCameraPositionYRef.current,
      0
    );

    // Update orbit control.
    orbitControlsRef.current.update();
  }

  //----------------------------------------------------------------------------
  // Load gltf.
  //----------------------------------------------------------------------------
  // TODO: Remove meshArray later.
  function loadMesh(gltf) {
    // 1. Find the default mesh in scene children.
    meshArray.current = [];
    morphMeshArray.current = [];

    // console.log("gltf.scene: ", gltf.scene);
    // console.log("gltf.scene.children: ", gltf.scene.children);

    for (let i = 0; i < gltf.scene.children.length; i++) {
      // console.log(`gltf.scene.children[${i}]: `, gltf.scene.children[i]);

      // Check mesh name for verification.
      if (defaultMeshArray.includes(gltf.scene.children[i].name)) {
        // console.log(
        //   `gltf.scene.children[${i}].name: `,
        //   gltf.scene.children[i].name
        // );

        // Add mesh to meshArray variable for transformation.
        meshArray.current.push(gltf.scene.children[i]);

        // Add face's children meshes to morphMeshArray variable for blend shape.
        if (gltf.scene.children[i].name === HEAD_MESH_NAME) {
          for (let j = 0; j < gltf.scene.children[i].children.length; j++) {
            // console.log(
            //   `Add gltf.scene.children[${i}].children[${j}].name to morphMeshArray: `,
            //   gltf.scene.children[i].children[j].name
            // );
            morphMeshArray.current.push(gltf.scene.children[i].children[j]);
          }
        }
      }
    }

    // 2. Add the found mesh to scene.
    meshArray.current.forEach((element) => {
      sceneRef.current.add(element);
    });

    // 3. Set animation loop.
    rendererRef.current.setAnimationLoop(() => {
      deltaRef.current += clock.current.getDelta();
      // console.log("deltaRef.current: ", deltaRef.current);
      // console.log("INTERVAL.current: ", INTERVAL.current);
      if (deltaRef.current > INTERVAL.current) {
        renderAvatar();
        deltaRef.current = deltaRef.current % INTERVAL.current;

        // Update stat.
        // statsLib.current.update();
      }
    });
  }

  async function loadGLTF(url) {
    // console.log("call loadGLTF()");
    // console.log("url: ", url);
    // Make ktx loader instance.
    const ktx2Loader = new STDLIB.KTX2Loader()
      .setTranscoderPath("js/libs/basis/")
      .detectSupport(rendererRef.current);

    // Make gltf loader instance.
    const gltfLoader = new STDLIB.GLTFLoader()
      .setKTX2Loader(ktx2Loader)
      .setMeshoptDecoder(STDLIB.MeshoptDecoder);

    // Show gltf loading circle.
    // console.log("Loading visible when gltf loading started.");
    setShowGltfLoadingProgress("visible");

    // Install GLTFLoader plugin
    gltfLoader.register((parser) => {
      return new ThreeVrm.VRMLoaderPlugin(parser);
    });

    // Load gltf data.
    gltfLoader.load(
      url,
      function (gltf) {
        // console.log("gltf.userData.vrm: ", gltf.userData.vrm);

        if (gltf.userData.vrm) {
          currentVrmRef.current = gltf.userData.vrm;
          // console.log("currentVrmRef.current: ", currentVrmRef.current);
          // ThreeVrm.VRMUtils.removeUnnecessaryJoints(gltf.scene);

          // Rotate model 180deg to face camera
          // https://github.com/pixiv/three-vrm/blob/dev/docs/migration-guide-1.0.md
          ThreeVrm.VRMUtils.rotateVRM0(currentVrmRef.current);

          // Add vrm model to scene.
          // currentVrmRef.current.humanoid.autoUpdateHumanBones = false;
          sceneRef.current.add(currentVrmRef.current.scene);
          // console.log(
          //   "currentVrmRef.current.scene: ",
          //   currentVrmRef.current.scene
          // );

          // Create light.
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
        }

        // Keep gltf data to loadedGltfData variable.
        loadedGltftData.current = gltf;
        loadMesh(loadedGltftData.current);
        // console.log("Loading hidden when gltf loaidng finished.");
        setShowGltfLoadingProgress("hidden");
      },
      function (xhr) {
        if (xhr.lengthComputable === true && xhr.total !== 0) {
          const progressPercent = Math.round((xhr.loaded / xhr.total) * 100);
          console.log(`${progressPercent}% loaded`);
          setGltfLoadingProgress(progressPercent);
        } else {
          console.log(humanFileSize(xhr.loaded) + " loaded");
        }
      },
      function (error) {
        console.error(error);
        // console.log("Loading hidden when error happened.");
        setShowGltfLoadingProgress("hidden");
      }
    );
  }

  //----------------------------------------------------------------------------
  // Make stream.
  //----------------------------------------------------------------------------
  async function getMediaStream() {
    // 1. Extract mediaStream:
    let originalUserMedia;
    try {
      originalUserMedia = await navigator.mediaDevices.getUserMedia({
        audio: true,
        // In mobile, this option makes errors.
        // video: { width: 640, height: 360 },
        video: true,
      });

      try {
        // 2. Extract audio track:
        const audioTrack = originalUserMedia.getAudioTracks()[0];

        // console.log("avatarCanvas.current: ", avatarCanvas.current);
        // 3. Get video from canvas:
        const canvasVideoStream = avatarCanvas.current.captureStream(
          AVATAR_CANVAS_CAPTURE_FRAME_RATE
        );
        const canvasVideoTrack = canvasVideoStream.getVideoTracks()[0];

        // 4. Composite the new mediastream:
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

  //----------------------------------------------------------------------------
  // Render data.
  //----------------------------------------------------------------------------
  function renderAvatar() {
    // console.log("call renderAvatar()");

    // 1. Set avatar idle status transformation.
    if (isIdleStatus.current) {
      transformIdleAvatar();
    }

    // 2. Render avatar and update control.
    if (morphMeshArray.current.length > 0) {
      // 2-1. Set avatar influence.
      morphMeshArray.current.forEach((meshElement) => {
        if (meshElement.hasOwnProperty("morphTargetInfluences")) {
          for (let i = 0; i < TOTAL_MORPH_COUNT; i++) {
            meshElement.morphTargetInfluences[i] = avatarInfluence.current[i];
          }
        }
      });
    }

    // 2-2. Set avatar quartenion.
    // console.log("meshArray.current: ", meshArray.current);
    // console.log("avatarQuartenionArray.current: ", avatarQuartenionArray.current);
    if (avatarQuartenionArray.current) {
      meshArray.current.forEach((element) => {
        element.quaternion.fromArray(avatarQuartenionArray.current);
      });
    }

    // 2-3. Set avatar position.
    // console.log("avatarPosition.current: ", avatarPosition.current);
    meshArray.current.forEach((element) => {
      element.position.set(
        avatarPosition.current[0],
        avatarPosition.current[1],
        avatarPosition.current[2]
      );
    });

    // 2-4. Set avatar scale.
    // console.log("avatarScale.current: ", avatarScale.current);
    if (avatarScale.current) {
      meshArray.current.forEach((element) => {
        element.scale.set(
          avatarScale.current,
          avatarScale.current,
          avatarScale.current
        );
      });
    }

    if (currentVrmRef.current) {
      currentVrmRef.current.update(deltaRef.current);
    }

    // 3. Render scene and camera.
    rendererRef.current.render(sceneRef.current, orbitCameraRef.current);

    // 4. Update control.
    orbitControlsRef.current.update();
  }

  function setAvatarScale({
    scale = 5,
    positionScale = 2,
    position = [0, 0, 0],
  }) {
    AVATAR_SCALE.current = scale;
    AVATAR_POSITION_SCALE.current = positionScale;
    AVATAR_MOVE_POSITION.current = position;
  }

  //----------------------------------------------------------------------------
  // Set morph data.
  //----------------------------------------------------------------------------
  function setMorphData(trackData) {
    // console.log("trackData: ", trackData);
    const _confidence = trackData.confidence;

    if (_confidence < FACE_DETECT_THRESHOLD.current) {
      // console.log("_confidence: ", _confidence);
      if (isIdleStatus.current === false) {
        idleStatusTimer.current = alterCoreLib.current.Timer.start();
        isIdleStatus.current = true;
      }
      return;
    } else {
      isIdleStatus.current = false;
    }

    // 1. Get and set morph data.
    let data = trackData.blendshapes["_innerMap"];
    // console.log("data: ", data);
    // console.log("data[0]: ", data[0]);
    // console.log("data[1]: ", data[1]);
    // This is for realbits demo file.
    avatarInfluence.current[0] = data.get("browOuterUp_L");
    avatarInfluence.current[1] = data.get("browInnerUp_L");
    avatarInfluence.current[2] = data.get("browDown_L");
    avatarInfluence.current[3] = data.get("eyeBlink_L");
    avatarInfluence.current[4] = data.get("eyeSquint_L");
    avatarInfluence.current[5] = data.get("eyeWide_L");
    avatarInfluence.current[6] = data.get("eyeLookUp_L");
    avatarInfluence.current[7] = data.get("eyeLookOut_L");
    avatarInfluence.current[8] = data.get("eyeLookIn_L");
    avatarInfluence.current[9] = data.get("eyeLookDown_L");
    avatarInfluence.current[10] = data.get("noseSneer_L");
    avatarInfluence.current[11] = data.get("mouthUpperUp_L");
    avatarInfluence.current[12] = data.get("mouthSmile_L");
    avatarInfluence.current[13] = data.get("mouthLeft");
    avatarInfluence.current[14] = data.get("mouthFrown_L");
    avatarInfluence.current[15] = data.get("mouthLowerDown_L");
    avatarInfluence.current[16] = data.get("jawLeft");
    avatarInfluence.current[17] = data.get("cheekPuff");
    avatarInfluence.current[18] = data.get("mouthShrugUpper");
    avatarInfluence.current[19] = data.get("mouthFunnel");
    avatarInfluence.current[20] = data.get("mouthRollLower");
    avatarInfluence.current[21] = data.get("jawOpen");
    avatarInfluence.current[22] = data.get("tongueOut");
    avatarInfluence.current[23] = data.get("mouthPucker");
    avatarInfluence.current[24] = data.get("mouthRollUpper");
    avatarInfluence.current[25] = data.get("jawRight");
    avatarInfluence.current[26] = data.get("mouthLowerDown_R");
    avatarInfluence.current[27] = data.get("mouthFrown_R");
    avatarInfluence.current[28] = data.get("mouthRight");
    avatarInfluence.current[29] = data.get("mouthSmile_R");
    avatarInfluence.current[30] = data.get("mouthUpperUp_R");
    avatarInfluence.current[31] = data.get("noseSneer_R");
    avatarInfluence.current[32] = data.get("eyeLookDown_R");
    avatarInfluence.current[33] = data.get("eyeLookIn_R");
    avatarInfluence.current[34] = data.get("eyeLookOut_R");
    avatarInfluence.current[35] = data.get("eyeLookUp_R");
    avatarInfluence.current[36] = data.get("eyeWide_R");
    avatarInfluence.current[37] = data.get("eyeSquint_R");
    avatarInfluence.current[38] = data.get("eyeBlink_R");
    avatarInfluence.current[39] = data.get("browDown_R");
    avatarInfluence.current[40] = data.get("browInnerUp_R");
    avatarInfluence.current[41] = data.get("browOuterUp_R");
    // avatarInfluence.current[] = data.get("cheekSquintLeft");
    // avatarInfluence.current[] = data.get("cheekSquintRight");
    // avatarInfluence.current[] = data.get("mouthClose");
    // avatarInfluence.current[] = data.get("jawForward");
    // avatarInfluence.current[] = data.get("mouthDimpleLeft");
    // avatarInfluence.current[] = data.get("mouthDimpleRight");
    // avatarInfluence.current[] = data.get("mouthPressLeft");
    // avatarInfluence.current[] = data.get("mouthPressRight");
    // avatarInfluence.current[] = data.get("mouthShrugLower");
    // avatarInfluence.current[] = data.get("mouthStretchLeft");
    // avatarInfluence.current[] = data.get("mouthStretchRight");
    // console.log("avatarInfluence.current: ", avatarInfluence.current);

    // 2. Get and set rotation data.
    data = trackData.rotationQuaternion["_elements"];
    // console.log("data: ", data);
    avatarQuartenionArray.current[0] = data[0];
    avatarQuartenionArray.current[1] = data[1];
    avatarQuartenionArray.current[2] = data[2];
    avatarQuartenionArray.current[3] = data[3];
    // console.log(
    //   "avatarQuartenionArray.current: ",
    //   avatarQuartenionArray.current
    // );

    // 3. Get and set scale data.
    const _positionData = trackData.normalizedImagePosition["_elements"];
    avatarScale.current = trackData.normalizedImageScale * AVATAR_SCALE.current;
    // console.log("avatarScale.current: ", avatarScale.current);

    // 4. Get and set position data.
    // console.log("_positionData: ", _positionData);
    // _positionData : 0(min) - 1(max) (normalized value)
    // fov: 45, near: 1, far: 20. camera position: 0, 0, 3
    // So, range: -(near + camera z) ~ +(near + camera z) and multiply 2 * (near + camera z)
    avatarPosition.current[0] =
      (_positionData[0] - 0.5 + AVATAR_MOVE_POSITION.current[0]) *
      AVATAR_POSITION_SCALE.current;
    avatarPosition.current[1] =
      (_positionData[1] -
        0.5 +
        AVATAR_MOVE_POSITION.current[1] * currentWindowRatioRef.current) *
      AVATAR_POSITION_SCALE.current;
    avatarPosition.current[2] = 0 + AVATAR_MOVE_POSITION.current[2];
    // console.log("avatarPosition.current: ", avatarPosition.current);
  }

  //----------------------------------------------------------------------------
  // Transform function when idle time (no face detection).
  //----------------------------------------------------------------------------
  function transformIdleAvatar() {
    console.log("call transformIdleAvatar()");

    // 1. Calculate the elapsed time of idle status.
    const elapsedIdleTime = idleStatusTimer.current.tick().elapsed;
    // console.log("elapsedIdleTime: ", elapsedIdleTime);
    const smile = 0.5 + 0.5 * Math.sin(elapsedIdleTime * 0.5);

    // 2. Set avatar influence.
    for (let i = 0; i < TOTAL_MORPH_COUNT; i++) {
      avatarInfluence.current[i] = 0;
    }
    // mouthSmile_L
    avatarInfluence.current[23] = smile;
    // mouthSmile_R
    avatarInfluence.current[24] = smile;

    // 3. Set avatar quartenion.
    const rotationData = alterCoreLib.current.Quaternion.fromRotation(
      0.3 * Math.sin(elapsedIdleTime * 0.5),
      alterCoreLib.current.Vec3.xAxis
    )["_elements"];
    avatarQuartenionArray.current[0] = rotationData[0];
    avatarQuartenionArray.current[1] = rotationData[1];
    avatarQuartenionArray.current[2] = rotationData[2];
    avatarQuartenionArray.current[3] = rotationData[3];
  }

  // Z-index
  // avatar canvas : 10
  // righ-top avatar canvas : 100
  // button : 100
  // dialog : > 100
  return (
    <>
      {/*------------------------------------------------------------------*/}
      {/* 1. Video source for alter core avatar library. */}
      {/*------------------------------------------------------------------*/}
      <video
        id="sourceVideo"
        style={{ display: "none" }}
        autoPlay={true}
        playsInline={true}
        muted={true}
        loop={true}
        preload={"auto"}
      ></video>

      {/*------------------------------------------------------------------*/}
      {/* 2. Canvas for avatar of GLTF format. */}
      {/*------------------------------------------------------------------*/}
      <canvas
        id="avatarCanvas"
        ref={avatarCanvas}
        hidden={!showAvatarView}
      ></canvas>
      <Stats ref={initializeStats}></Stats>
      {/* <HolisticTrackData ref={initializeHolisticTrackData}></HolisticTrackData> */}

      <Box
        width="160px"
        height="120px"
        border={0}
        borderColor="secondary.main"
        hidden={!showGuideCanvas}
        sx={{
          top: 0,
          left: 0,
          zIndex: Z_INDEX.dialog,
          position: "absolute",
          display: "flex",
          transform: "scale(-1, 1)",
        }}
      >
        <canvas id="guideCanvas" ref={guideCanvasRef} />
      </Box>

      {/*------------------------------------------------------------------*/}
      {/* 3. GLTF loading progress circle.
      {/*------------------------------------------------------------------*/}
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
