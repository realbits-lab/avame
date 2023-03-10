import React from "react";
import * as THREE from "three";
import * as ThreeVrm from "@pixiv/three-vrm";
import * as STDLIB from "three-stdlib";
import loadable from "@loadable/component";
import { Box, CircularProgress, Typography } from "@mui/material";
import { ScreenPosition, Z_INDEX } from "./RealBitsUtil";
import { humanFileSize } from "rent-market";
import HolisticData from "./HolisticData";
const Stats = loadable.lib(
  () => import("three/examples/jsm/libs/stats.module.js"),
  {
    ssr: false,
  }
);

function AvatarView({
  gltfDataUrl,
  getImageDataUrlFunc,
  getMediaStreamFunc,
  setTransformAvatarFunc,
  showGuideCanvas = false,
  showFrameStats = false,
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

  //*---------------------------------------------------------------------------
  //* GLTF loading variable.
  //*---------------------------------------------------------------------------
  const [gltfLoadingProgress, setGltfLoadingProgress] = React.useState(0);
  // visibility: hidden or visible
  const [showGltfLoadingProgress, setShowGltfLoadingProgress] =
    React.useState("hidden");

  //*---------------------------------------------------------------------------
  //* Mesh transfomation data.
  //* - rotation, position, and scale
  //*---------------------------------------------------------------------------
  const FRAME_COUNT = 60;

  //*---------------------------------------------------------------------------
  //* Mutable variable with useRef.
  //*---------------------------------------------------------------------------
  const rendererRef = React.useRef();
  const sceneRef = React.useRef();
  const deltaRef = React.useRef(0);
  const INTERVAL = React.useRef(1 / FRAME_COUNT);
  const clock = React.useRef();
  const statsLib = React.useRef();
  const currentWindowRatioRef = React.useRef(1);
  const showAvatarOptionRef = React.useRef(true);
  const loadedGltftData = React.useRef();
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
  const avatarCanvas = React.useRef(null);
  const currentAvatarDataUrl = React.useRef();
  const guideCanvasRef = React.useRef();
  const AVATAR_CANVAS_CAPTURE_FRAME_RATE = 20;
  const WHITE_COLOR_HEX = 0xffffff;
  const CIRCULAR_PROGRESS_SIZE = 112;

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

  const setBackgroundVideo = ({ canvasPosition, screenVideoStreamRef }) => {
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
      if (avatarCanvas.current) {
        avatarCanvas.current.style.border = "";
      }
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
        avatarCanvas.current.style.position = "absolute";
        avatarCanvas.current.style.zIndex = Z_INDEX.avatarCanvasCenter;
        avatarCanvas.current.style.width = "100%";
        avatarCanvas.current.style.height = "100%";
        avatarCanvas.current.style.right = "0px";
        avatarCanvas.current.style.top = "0px";
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
    resizedContext.drawImage(
      avatarCanvasElement,
      0,
      0,
      resizedCanvas.width,
      resizedCanvas.height
    );
    const myResizedData = resizedCanvas.toDataURL();

    // return avatarCanvasElement.toDataURL();
    return myResizedData;
  }

  //*---------------------------------------------------------------------------
  //* Initialize data.
  //*---------------------------------------------------------------------------
  async function initializeContent(url) {
    // console.log("initializeContent function url: ", url);

    makeContentInstance();
    await loadGLTF(url);
  }

  //*---------------------------------------------------------------------------
  //* Make instances.
  //*---------------------------------------------------------------------------
  function makeContentInstance() {
    //* Make camera instance.
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

    //* Make sceneRef instance.
    sceneRef.current = new THREE.Scene();

    //* Make rendererRef instance.
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

    //* Add resize event listener.
    window.addEventListener("resize", () => {
      // console.log("-- resize event");

      //* Get current window ratio.
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

      //* Set renderer configuration of size and pixel ratio.
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.setPixelRatio(window.devicePixelRatio);

      //* Redraw avatar.
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

    //* Make environment instance.
    const environment = new STDLIB.RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current);
    sceneRef.current.environment =
      pmremGenerator.fromScene(environment).texture;

    // //* Make control instance.
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
      currentOrbitCameraPositionXRef.current,
      currentOrbitCameraPositionYRef.current,
      currentOrbitCameraPositionZRef.current
    );
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

        //* Set animation loop.
        rendererRef.current.setAnimationLoop(() => {
          deltaRef.current += clock.current.getDelta();
          // console.log("deltaRef.current: ", deltaRef.current);
          // console.log("INTERVAL.current: ", INTERVAL.current);

          if (deltaRef.current > INTERVAL.current) {
            // console.log("render");
            renderAvatar();
            deltaRef.current = deltaRef.current % INTERVAL.current;

            if (showFrameStats === true) {
              //* Update stat.
              statsLib.current.update();
            }
          }
        });

        //* Set camera setting.
        adjustCamera({ gltf: loadedGltftData.current });

        // console.log("Loading hidden when gltf loaidng finished.");
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

      orbitCameraRef.current.ratio = camera.aspect;
      orbitCameraRef.current.fov = camera.fov;
      orbitCameraRef.current.near = camera.near;
      orbitCameraRef.current.far = camera.far;
      orbitCameraRef.current.position.set(
        camera.position.x,
        camera.position.y,
        -1 * camera.position.z
      );
      // console.log("orbitCameraRef.current.fov: ", orbitCameraRef.current.fov);
      // console.log("orbitCameraRef.current.near: ", orbitCameraRef.current.near);
      // console.log("orbitCameraRef.current.far: ", orbitCameraRef.current.far);

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

        // console.log("avatarCanvas.current: ", avatarCanvas.current);
        //* Get video from canvas:
        const canvasVideoStream = avatarCanvas.current.captureStream(
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

    //* Update vrm.
    if (currentVrmRef.current) {
      currentVrmRef.current.update(deltaRef.current);
    }

    //* Update scene and camera.
    rendererRef.current.render(sceneRef.current, orbitCameraRef.current);

    //* Update control.
    orbitControlsRef.current.update();
  }

  // Z-index
  // avatar canvas : 10
  // righ-top avatar canvas : 100
  // button : 100
  // dialog : > 100
  return (
    <>
      {/*//*-----------------------------------------------------------------*/}
      {/*//* Video source for alter core avatar library.                     */}
      {/*//*-----------------------------------------------------------------*/}
      <video
        id="sourceVideo"
        style={{ display: "none" }}
        autoPlay={true}
        playsInline={true}
        muted={true}
        loop={true}
        preload={"auto"}
        width="1280px"
        height="720px"
      ></video>

      {/*//*-----------------------------------------------------------------*/}
      {/*//* Canvas for avatar of GLTF format.                               */}
      {/*//*-----------------------------------------------------------------*/}
      <canvas id="avatarCanvas" ref={avatarCanvas}></canvas>
      <Stats ref={initializeStats}></Stats>

      {showGuideCanvas ? (
        <Box
          width="160px"
          height="120px"
          border={0}
          borderColor="secondary.main"
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
      ) : null}

      <HolisticData currentVrmRef={currentVrmRef} />

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
