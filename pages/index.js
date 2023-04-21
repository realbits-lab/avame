import React from "react";
import AvatarView from "../components/AvatarView";
import TakePicture from "../components/TakePicture";
import RentContent from "../components/RentContent";
import ButtonMenu from "../components/ButtonMenu";
import VideoChat from "../components/VideoChat";

const Service = () => {
  //*---------------------------------------------------------------------------
  //* Constant variables.
  //*---------------------------------------------------------------------------
  //* TODO: Change later.
  // const DEFAULT_MODEL_PATH = "default.vrm";
  const DEFAULT_MODEL_PATH =
    "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/vrm/1.vrm";
  const [avatarUrl, setAvatarUrl] = React.useState(DEFAULT_MODEL_PATH);

  //*---------------------------------------------------------------------------
  //* Variable references.
  //*---------------------------------------------------------------------------
  const rentMarketRef = React.useRef();

  //*---------------------------------------------------------------------------
  //* Function references.
  //*---------------------------------------------------------------------------
  const getImageDataUrl = React.useRef();
  const getV3dCoreFuncRef = React.useRef();
  const getMediaStreamFuncRef = React.useRef();
  const setAvatarPositionFuncRef = React.useRef();
  const takePictureFuncRef = React.useRef();
  const startRecordingFuncRef = React.useRef();
  const stopRecordingFuncRef = React.useRef();
  const startScreenStreamFuncRef = React.useRef();
  const stopScreenStreamFuncRef = React.useRef();
  const openMyFuncRef = React.useRef();
  const openMarketFuncRef = React.useRef();
  const getRecordStatusFuncRef = React.useRef();
  const requestDataFuncRef = React.useRef();
  const setBackgroundScreenFuncRef = React.useRef();
  const setBackgroundVideoFuncRef = React.useRef();
  const stopScreenEventFuncRef = React.useRef();

  function selectAvatarFunc(element) {
    // console.log("call selectAvatarFunc()");
    // console.log("element.metadata: ", element.metadata);
    // console.log(
    //   "element.metadata.realbits.vrm_url: ",
    //   element.metadata.realbits.vrm_url
    // );

    setAvatarUrl(element.metadata.realbits.vrm_url);
  }

  return (
    <>
      {/* //*----------------------------------------------------------------*/}
      {/* //* RentContent component.                                         */}
      {/* //*----------------------------------------------------------------*/}
      <RentContent
        selectAvatarFunc={selectAvatarFunc}
        rentMarketAddress={process.env.NEXT_PUBLIC_RENT_MARKET_CONTRACT_ADDRESS}
        blockchainNetwork={process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK}
        testNftAddress={process.env.NEXT_PUBLIC_LOCAL_NFT_CONTRACT_ADDRESS}
        serviceAddress={process.env.NEXT_PUBLIC_SERVICE_OWNER_ADDRESS}
        openMyFuncRef={openMyFuncRef}
        openMarketFuncRef={openMarketFuncRef}
        rentMarketRef={rentMarketRef}
      />

      {/*//*-----------------------------------------------------------------*/}
      {/*//* AvatarView component.                                           */}
      {/*//*-----------------------------------------------------------------*/}
      <AvatarView
        inputGltfDataUrl={avatarUrl}
        getV3dCoreFuncRef={getV3dCoreFuncRef}
        getImageDataUrlFunc={getImageDataUrl}
        // VideoChat -> AvatarView call for new Remon.
        // TakeVideo -> AvatarView call for recording video.
        getMediaStreamFunc={getMediaStreamFuncRef}
        // VideoChat -> AvatarView call for changing avatar canvas position.
        // ScreenView -> AvatarView call for changing avatar canvas position.
        setAvatarPositionFunc={setAvatarPositionFuncRef}
        showGuideCanvas={true}
        showFrameStats={false}
        useMotionUpdate={true}
      />

      {/*//*-----------------------------------------------------------------*/}
      {/*//*TakePicture component.                                           */}
      {/*//*-----------------------------------------------------------------*/}
      <TakePicture
        getImageDataUrlFunc={getImageDataUrl}
        takePictureFuncRef={takePictureFuncRef}
        rentMarketRef={rentMarketRef}
      />

      {/*//*-----------------------------------------------------------------*/}
      {/*//* Fab menu button.                                                */}
      {/*//*-----------------------------------------------------------------*/}
      <ButtonMenu
        useFab={true}
        startScreenStreamFuncRef={startScreenStreamFuncRef}
        stopScreenStreamFuncRef={stopScreenStreamFuncRef}
        takePictureFuncRef={takePictureFuncRef}
        startRecordingFuncRef={startRecordingFuncRef}
        stopRecordingFuncRef={stopRecordingFuncRef}
        getRecordStatusFuncRef={getRecordStatusFuncRef}
        requestDataFuncRef={requestDataFuncRef}
        openMyFuncRef={openMyFuncRef}
        openMarketFuncRef={openMarketFuncRef}
        stopScreenEventFuncRef={stopScreenEventFuncRef}
        rentMarketRef={rentMarketRef}
      />

      {/*//*-----------------------------------------------------------------*/}
      {/*//* Video chat component.                                           */}
      {/*//*-----------------------------------------------------------------*/}
      <VideoChat
        // VideoChat -> AvatarView call for new Remon.
        inputGetMediaStreamFuncRef={getMediaStreamFuncRef}
        // VideoChat -> AvatarView call for changing avatar canvas position.
        inputSetAvatarPositionFuncRef={setAvatarPositionFuncRef}
        // ScreenView -> VideoChat call for setting background screen.
        inputSetBackgroundScreenFuncRef={setBackgroundScreenFuncRef}
        rentMarketRef={rentMarketRef}
      />
    </>
  );
};

export default Service;
