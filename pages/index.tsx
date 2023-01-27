import React from "react";
import AvatarView from "../components/AvatarView";
import TakePicture from "../components/TakePicture";
import RentContent from "../components/RentContent";

const Service = () => {
  // * -------------------------------------------------------------------------
  // * Constant variables.
  // * -------------------------------------------------------------------------
  const [avatarUrl, setAvatarUrl] = React.useState("default.vrm");

  // * -------------------------------------------------------------------------
  // * Variable references.
  // * -------------------------------------------------------------------------
  const rentMarketRef = React.useRef();

  // * -------------------------------------------------------------------------
  // * Function references.
  // * -------------------------------------------------------------------------
  const getImageDataUrl = React.useRef();
  const getMediaStreamFuncRef = React.useRef();
  const setTransformAvatarFuncRef = React.useRef();
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

  function selectAvatar(element: {
    metadata: { realbits: { avatar_url: React.SetStateAction<string> } };
  }) {
    // console.log("selectAvatar metadata: ", element.metadata);
    setAvatarUrl(element.metadata.realbits.avatar_url);
  }

  return (
    <>
      {/* // * --------------------------------------------------------------*/}
      {/* // * RentContent component.                                        */}
      {/* // * --------------------------------------------------------------*/}
      <RentContent
        selectAvatarFunc={selectAvatar}
        rentMarketAddress={process.env.NEXT_PUBLIC_RENT_MARKET_CONTRACT_ADDRESS}
        blockchainNetwork={process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK}
        testNftAddress={process.env.NEXT_PUBLIC_LOCAL_NFT_CONTRACT_ADDRESS}
        serviceAddress={process.env.NEXT_PUBLIC_SERVICE_OWNER_ADDRESS}
        openMyFuncRef={openMyFuncRef}
        openMarketFuncRef={openMarketFuncRef}
        rentMarketRef={rentMarketRef}
      />

      {/* // * --------------------------------------------------------------*/}
      {/* // * AvatarView component.                                         */}
      {/* // * --------------------------------------------------------------*/}
      <AvatarView
        gltfDataUrl={avatarUrl}
        getImageDataUrlFunc={getImageDataUrl}
        // VideoChat -> AvatarView call for new Remon.
        // TakeVideo -> AvatarView call for recording video.
        getMediaStreamFunc={getMediaStreamFuncRef}
        // VideoChat -> AvatarView call for changing avatar canvas position.
        // ScreenView -> AvatarView call for changing avatar canvas position.
        setTransformAvatarFunc={setTransformAvatarFuncRef}
      />

      {/* // * --------------------------------------------------------------*/}
      {/* // * TakePicture component.                                        */}
      {/* // * --------------------------------------------------------------*/}
      <TakePicture
        getImageDataUrlFunc={getImageDataUrl}
        takePictureFuncRef={takePictureFuncRef}
        rentMarketRef={rentMarketRef}
      />
    </>
  );
};

export default Service;
