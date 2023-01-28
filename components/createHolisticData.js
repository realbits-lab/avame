import {
  POSE_CONNECTIONS,
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  Holistic,
} from "@mediapipe/holistic";
import * as CameraUtils from "@mediapipe/camera_utils";
import * as DrawingUtils from "@mediapipe/drawing_utils";
import * as Kalidokit from "kalidokit";
import * as THREE from "three";
import * as ThreeVrm from "@pixiv/three-vrm";

async function createHolisticData(currentVrmRef, videoElement, guideCanvas) {
  console.log("call createHolisticData()");

  let oldLookTarget = new THREE.Euler();
  const lerp = Kalidokit.Vector.lerp;
  const remap = Kalidokit.Utils.remap;
  const clamp = Kalidokit.Utils.clamp;

  //* Make holistic instance.
  const holistic = new Holistic({
    locateFile: (file) => {
      console.log("file: ", file);
      return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`;
    },
  });
  await holistic.initialize();

  //* Set holistic option.
  holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: false,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
    refineFaceLandmarks: true,
  });

  //* Register function to a holistic onResult event.
  holistic.onResults(onResults);

  //* Make camera instance and connect holistic.
  const camera = new CameraUtils.Camera(videoElement, {
    onFrame: async () => {
      await holistic.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });

  //* Start a camera.
  console.log("Start camera.");
  camera.start();

  function onResults(results) {
    // console.log("call onResults()");

    //* Draw landmark guides
    drawResults(results);

    //* Animate model
    animateVRM(currentVrmRef.current, results);
  }

  function drawResults(results) {
    if (!guideCanvas) {
      return;
    }

    guideCanvas.width = videoElement.videoWidth;
    guideCanvas.height = videoElement.videoHeight;

    let canvasContext = guideCanvas.getContext("2d");
    canvasContext.save();
    canvasContext.clearRect(0, 0, guideCanvas.width, guideCanvas.height);

    //* Use `Mediapipe` drawing functions
    DrawingUtils.drawConnectors(
      canvasContext,
      results.poseLandmarks,
      POSE_CONNECTIONS,
      {
        color: "#00cff7",
        lineWidth: 2,
      }
    );
    DrawingUtils.drawLandmarks(canvasContext, results.poseLandmarks, {
      color: "#ff0364",
      lineWidth: 1,
    });
    DrawingUtils.drawConnectors(
      canvasContext,
      results.faceLandmarks,
      FACEMESH_TESSELATION,
      {
        color: "#C0C0C070",
        lineWidth: 1,
      }
    );

    if (results.faceLandmarks && results.faceLandmarks.length === 478) {
      // 2. draw pupils
      DrawingUtils.drawLandmarks(
        canvasContext,
        [results.faceLandmarks[468], results.faceLandmarks[468 + 5]],
        {
          color: "#ffe603",
          lineWidth: 1,
        }
      );
    }
    DrawingUtils.drawConnectors(
      canvasContext,
      results.leftHandLandmarks,
      HAND_CONNECTIONS,
      {
        color: "#eb1064",
        lineWidth: 2,
      }
    );
    DrawingUtils.drawLandmarks(canvasContext, results.leftHandLandmarks, {
      color: "#00cff7",
      lineWidth: 1,
    });
    DrawingUtils.drawConnectors(
      canvasContext,
      results.rightHandLandmarks,
      HAND_CONNECTIONS,
      {
        color: "#22c3e3",
        lineWidth: 2,
      }
    );
    DrawingUtils.drawLandmarks(canvasContext, results.rightHandLandmarks, {
      color: "#ff0364",
      lineWidth: 1,
    });
  }

  function animateVRM(currentVrm, results) {
    // console.log("results: ", results);
    if (!currentVrm) {
      return;
    }

    //* Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
    let riggedPose, riggedLeftHand, riggedRightHand, riggedFace;

    const faceLandmarks = results.faceLandmarks;
    // Pose 3D Landmarks are with respect to Hip distance in meters
    const pose3DLandmarks = results.ea;
    // Pose 2D landmarks are with respect to videoWidth and videoHeight
    const pose2DLandmarks = results.poseLandmarks;
    // Be careful, hand landmarks may be reversed
    const leftHandLandmarks = results.rightHandLandmarks;
    const rightHandLandmarks = results.leftHandLandmarks;

    //* Animate Face
    if (faceLandmarks) {
      riggedFace = Kalidokit.Face.solve(faceLandmarks, {
        runtime: "mediapipe",
        video: videoElement,
      });
      // console.log("riggedFace: ", riggedFace);
      // console.log("riggedFace.eye.l: ", riggedFace.eye.l);
      // console.log("riggedFace.eye.r: ", riggedFace.eye.r);
      // console.log("riggedFace.brow: ", riggedFace.brow);
      // console.log("riggedFace.mouth.shape: ", riggedFace.mouth.shape);

      rigFace(riggedFace);
    }

    //* Animate Pose
    if (pose2DLandmarks && pose3DLandmarks) {
      riggedPose = Kalidokit.Pose.solve(pose3DLandmarks, pose2DLandmarks, {
        runtime: "mediapipe",
        video: videoElement,
      });
      rigRotation("Hips", riggedPose.Hips.rotation, 0.7);
      rigPosition(
        "Hips",
        {
          x: -riggedPose.Hips.position.x, // Reverse direction
          y: riggedPose.Hips.position.y + 1, // Add a bit of height
          z: -riggedPose.Hips.position.z, // Reverse direction
        },
        1,
        0.07
      );

      rigRotation("Chest", riggedPose.Spine, 0.25, 0.3);
      rigRotation("Spine", riggedPose.Spine, 0.45, 0.3);

      rigRotation("RightUpperArm", riggedPose.RightUpperArm, 1, 0.3);
      rigRotation("RightLowerArm", riggedPose.RightLowerArm, 1, 0.3);
      rigRotation("LeftUpperArm", riggedPose.LeftUpperArm, 1, 0.3);
      rigRotation("LeftLowerArm", riggedPose.LeftLowerArm, 1, 0.3);

      rigRotation("LeftUpperLeg", riggedPose.LeftUpperLeg, 1, 0.3);
      rigRotation("LeftLowerLeg", riggedPose.LeftLowerLeg, 1, 0.3);
      rigRotation("RightUpperLeg", riggedPose.RightUpperLeg, 1, 0.3);
      rigRotation("RightLowerLeg", riggedPose.RightLowerLeg, 1, 0.3);
    }

    // Animate Hands
    if (leftHandLandmarks) {
      riggedLeftHand = Kalidokit.Hand.solve(leftHandLandmarks, "Left");
      rigRotation("LeftHand", {
        // Combine pose rotation Z and hand rotation X Y
        z: riggedPose.LeftHand.z,
        y: riggedLeftHand.LeftWrist.y,
        x: riggedLeftHand.LeftWrist.x,
      });
      rigRotation("LeftRingProximal", riggedLeftHand.LeftRingProximal);
      rigRotation("LeftRingIntermediate", riggedLeftHand.LeftRingIntermediate);
      rigRotation("LeftRingDistal", riggedLeftHand.LeftRingDistal);
      rigRotation("LeftIndexProximal", riggedLeftHand.LeftIndexProximal);
      rigRotation(
        "LeftIndexIntermediate",
        riggedLeftHand.LeftIndexIntermediate
      );
      rigRotation("LeftIndexDistal", riggedLeftHand.LeftIndexDistal);
      rigRotation("LeftMiddleProximal", riggedLeftHand.LeftMiddleProximal);
      rigRotation(
        "LeftMiddleIntermediate",
        riggedLeftHand.LeftMiddleIntermediate
      );
      rigRotation("LeftMiddleDistal", riggedLeftHand.LeftMiddleDistal);
      rigRotation("LeftThumbProximal", riggedLeftHand.LeftThumbProximal);
      rigRotation(
        "LeftThumbIntermediate",
        riggedLeftHand.LeftThumbIntermediate
      );
      rigRotation("LeftThumbDistal", riggedLeftHand.LeftThumbDistal);
      rigRotation("LeftLittleProximal", riggedLeftHand.LeftLittleProximal);
      rigRotation(
        "LeftLittleIntermediate",
        riggedLeftHand.LeftLittleIntermediate
      );
      rigRotation("LeftLittleDistal", riggedLeftHand.LeftLittleDistal);
    }
    if (rightHandLandmarks) {
      riggedRightHand = Kalidokit.Hand.solve(rightHandLandmarks, "Right");
      rigRotation("RightHand", {
        // Combine Z axis from pose hand and X/Y axis from hand wrist rotation
        z: riggedPose.RightHand.z,
        y: riggedRightHand.RightWrist.y,
        x: riggedRightHand.RightWrist.x,
      });
      rigRotation("RightRingProximal", riggedRightHand.RightRingProximal);
      rigRotation(
        "RightRingIntermediate",
        riggedRightHand.RightRingIntermediate
      );
      rigRotation("RightRingDistal", riggedRightHand.RightRingDistal);
      rigRotation("RightIndexProximal", riggedRightHand.RightIndexProximal);
      rigRotation(
        "RightIndexIntermediate",
        riggedRightHand.RightIndexIntermediate
      );
      rigRotation("RightIndexDistal", riggedRightHand.RightIndexDistal);
      rigRotation("RightMiddleProximal", riggedRightHand.RightMiddleProximal);
      rigRotation(
        "RightMiddleIntermediate",
        riggedRightHand.RightMiddleIntermediate
      );
      rigRotation("RightMiddleDistal", riggedRightHand.RightMiddleDistal);
      rigRotation("RightThumbProximal", riggedRightHand.RightThumbProximal);
      rigRotation(
        "RightThumbIntermediate",
        riggedRightHand.RightThumbIntermediate
      );
      rigRotation("RightThumbDistal", riggedRightHand.RightThumbDistal);
      rigRotation("RightLittleProximal", riggedRightHand.RightLittleProximal);
      rigRotation(
        "RightLittleIntermediate",
        riggedRightHand.RightLittleIntermediate
      );
      rigRotation("RightLittleDistal", riggedRightHand.RightLittleDistal);
    }
  }

  function rigFace(riggedFace) {
    if (!currentVrmRef.current) {
      return;
    }
    rigRotation("Neck", riggedFace.head, 0.7);

    // expressionManager and Preset Name Schema
    const expressionManager = currentVrmRef.current.expressionManager;
    // console.log("currentVrmRef.current: ", currentVrmRef.current);
    // console.log("expressionManager: ", expressionManager);

    // Simple example without winking. Interpolate based on old blendshape, then stabilize blink with `Kalidokit` helper function.
    // for VRM, 1 is closed, 0 is open.
    riggedFace.eye.l = lerp(
      clamp(1 - riggedFace.eye.l, 0, 1),
      expressionManager.getValue(ThreeVrm.VRMExpressionPresetName.BlinkLeft),
      0.5
    );
    riggedFace.eye.r = lerp(
      clamp(1 - riggedFace.eye.r, 0, 1),
      expressionManager.getValue(ThreeVrm.VRMExpressionPresetName.BlinkRight),
      0.5
    );
    // riggedFace.eye = Kalidokit.Face.stabilizeBlink(
    //   riggedFace.eye,
    //   riggedFace.head.y
    // );
    // console.log("riggedFace.eye.l: ", riggedFace.eye.l);
    expressionManager.setValue(
      ThreeVrm.VRMExpressionPresetName.BlinkLeft,
      riggedFace.eye.l
    );
    expressionManager.setValue(
      ThreeVrm.VRMExpressionPresetName.BlinkRight,
      riggedFace.eye.r
    );

    // Interpolate and set mouth blendshapes
    expressionManager.setValue(
      ThreeVrm.VRMExpressionPresetName.Ih,
      lerp(
        riggedFace.mouth.shape.I,
        expressionManager.getValue(ThreeVrm.VRMExpressionPresetName.Ih),
        0.5
      )
    );

    // let aValue = expressionManager.getValue(
    //   ThreeVrm.VRMExpressionPresetName.Aa
    // );
    // console.log("pre aValue: ", aValue);
    expressionManager.setValue(
      ThreeVrm.VRMExpressionPresetName.Aa,
      lerp(
        riggedFace.mouth.shape.A,
        expressionManager.getValue(ThreeVrm.VRMExpressionPresetName.Aa),
        0.5
      )
    );
    // aValue = expressionManager.getValue(
    //   ThreeVrm.VRMExpressionPresetName.Aa
    // );
    // console.log("post aValue: ", aValue);
    // expressionManager.update();

    expressionManager.setValue(
      ThreeVrm.VRMExpressionPresetName.Ee,
      lerp(
        riggedFace.mouth.shape.E,
        expressionManager.getValue(ThreeVrm.VRMExpressionPresetName.Ee),
        0.5
      )
    );
    expressionManager.setValue(
      ThreeVrm.VRMExpressionPresetName.Oh,
      lerp(
        riggedFace.mouth.shape.O,
        expressionManager.getValue(ThreeVrm.VRMExpressionPresetName.Oh),
        0.5
      )
    );
    expressionManager.setValue(
      ThreeVrm.VRMExpressionPresetName.Ou,
      lerp(
        riggedFace.mouth.shape.U,
        expressionManager.getValue(ThreeVrm.VRMExpressionPresetName.Ou),
        0.5
      )
    );

    //PUPILS
    //interpolate pupil and keep a copy of the value
    let lookTarget = new THREE.Euler(
      lerp(oldLookTarget.x, riggedFace.pupil.y, 0.4),
      lerp(oldLookTarget.y, riggedFace.pupil.x, 0.4),
      0,
      "XYZ"
    );
    oldLookTarget.copy(lookTarget);
    // console.log("lookTarget: ", lookTarget);
    // console.log("currentVrmRef.current: ", currentVrmRef.current);
    // console.log("currentVrmRef.current.lookAt: ", currentVrmRef.current.lookAt);
    // console.log(
    //   "currentVrmRef.current.lookAt.applier: ",
    //   currentVrmRef.current.lookAt.applier
    // );
    // console.log(
    //   "currentVrmRef.current.lookAt.applier.lookAt: ",
    //   currentVrmRef.current.lookAt.applier.lookAt
    // );
    const yaw = THREE.MathUtils.RAD2DEG * lookTarget.y;
    const pitch = THREE.MathUtils.RAD2DEG * lookTarget.x;
    currentVrmRef.current.lookAt.applier.applyYawPitch(yaw, pitch);
  }

  // Animate Rotation Helper function
  const rigRotation = (
    name,
    rotation = { x: 0, y: 0, z: 0 },
    dampener = 1,
    lerpAmount = 0.3
  ) => {
    if (!currentVrmRef.current) {
      return;
    }
    const Part = currentVrmRef.current.humanoid.getNormalizedBoneNode(
      ThreeVrm.VRMHumanBoneName[name]
    );
    if (!Part) {
      return;
    }

    let euler = new THREE.Euler(
      rotation.x * dampener,
      rotation.y * dampener,
      rotation.z * dampener
    );
    let quaternion = new THREE.Quaternion().setFromEuler(euler);
    Part.quaternion.slerp(quaternion, lerpAmount);
    // console.log("update-Part.quaternion: ", Part.quaternion);
  };

  // Animate Position Helper Function
  const rigPosition = (
    name,
    position = { x: 0, y: 0, z: 0 },
    dampener = 1,
    lerpAmount = 0.3
  ) => {
    if (!currentVrmRef.current) {
      return;
    }
    const Part = currentVrmRef.current.humanoid.getRawBoneNode(
      ThreeVrm.VRMHumanBoneName[name]
    );
    if (!Part) {
      return;
    }
    let vector = new THREE.Vector3(
      position.x * dampener,
      position.y * dampener,
      position.z * dampener
    );
    Part.position.lerp(vector, lerpAmount); // interpolate
  };
}

export default createHolisticData;
