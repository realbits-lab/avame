import React from "react";

import AvatarView from "../components/AvatarView";

const Service = () => {
  //----------------------------------------------------------------------------
  // Constant variables.
  //----------------------------------------------------------------------------
  // "https://cdn.glitch.com/29e07830-2317-4b15-a044-135e73c7f840%2FAshtra.vrm?v=1630342336981";
  const [avatarUrl, setAvatarUrl] = React.useState("default.vrm");

  let RENT_MARKET_ADDRESS;
  let TEST_NFT_ADDRESS;
  let SERVICE_ADDRESS;
  let BLOCKCHAIN_NETWORK;
  // service url : https://realbits-snapshot.s3.ap-northeast-2.amazonaws.com/realbits-snapshot.json

  // Sample collection data.
  // collectionAddress: 0xE5C46238c2Cf9CD7A36a51274f04958A59daB161
  // collectionUri: https://js-nft.s3.ap-northeast-2.amazonaws.com/collection.json

  // console.log("App process.env.NETWORK: ", process.env.NETWORK);
  switch (process.env.NETWORK) {
    case "localhost":
    default:
      RENT_MARKET_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
      TEST_NFT_ADDRESS = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
      SERVICE_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      BLOCKCHAIN_NETWORK = "0x539";
      break;

    case "matic":
      RENT_MARKET_ADDRESS = "0x90f20cB6A0665B12c4f2B62796Ff183bF192F55c";
      TEST_NFT_ADDRESS = "0x82087ff39e079c44b98c3abd053f734b351d5b20";
      SERVICE_ADDRESS = "0x3851dacd8fA9F3eB64D69151A3597F33E5960A2F";
      BLOCKCHAIN_NETWORK = "0x137";
      break;

    case "maticmum":
      RENT_MARKET_ADDRESS = "0x1b5054C7931b18Ec8E0d5e5F5D0cBD845F3485b8";
      TEST_NFT_ADDRESS = "0x82087ff39e079c44b98c3abd053f734b351d5b20";
      SERVICE_ADDRESS = "0x3851dacd8fA9F3eB64D69151A3597F33E5960A2F";
      BLOCKCHAIN_NETWORK = "0x13881";
      break;
  }

  //----------------------------------------------------------------------------
  // Variable references.
  //----------------------------------------------------------------------------
  const rentMarketRef = React.useRef();

  //----------------------------------------------------------------------------
  // Function references.
  //----------------------------------------------------------------------------
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

  //----------------------------------------------------------------------------
  // Function.
  //----------------------------------------------------------------------------
  const selectAvatar = (element: {
    metadata: { realbits: { avatar_url: React.SetStateAction<string> } };
  }) => {
    // console.log("selectAvatar metadata: ", element.metadata);
    setAvatarUrl(element.metadata.realbits.avatar_url);
  };

  return (
    <>
      {/*------------------------------------------------------------------*/}
      {/* AvatarView component.                                            */}
      {/*------------------------------------------------------------------*/}
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
    </>
  );
};

export default Service;
