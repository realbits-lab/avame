import React from "react";
import { useRouter } from "next/router";
import { styled } from "@mui/system";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import HomeIcon from "@mui/icons-material/Home";
import AvatarSelect from "@/components/AvatarSelect";
import AvatarView from "@/components/AvatarView";
import TakePicture from "@/components/TakePicture";
import RentContent from "@/components/RentContent";
import ButtonMenu from "@/components/ButtonMenu";
import VideoChat from "@/components/VideoChat";
import ChatMessage from "@/components/ChatMessage";

export default function Service() {
  //*---------------------------------------------------------------------------
  //* Constant variables.
  //*---------------------------------------------------------------------------
  const AVAME_MODE = "avame";
  const AVACHAT_MODE = "avachat";
  const SERVICE_MODE = process.env.NEXT_PUBLIC_SERVICE_MODE;
  //* TODO: Change later.
  const DEFAULT_MODEL_PATH = "dulls.vrm";
  // const DEFAULT_MODEL_PATH =
  //   "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/vrm/1.vrm";
  const [avatarUrl, setAvatarUrl] = React.useState(DEFAULT_MODEL_PATH);

  //*---------------------------------------------------------------------------
  //* Variable references.
  //*---------------------------------------------------------------------------
  const rentMarketRef = React.useRef();
  const setTalkFuncRef = React.useRef();

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
  const setAvatarExpressionFuncRef = React.useRef();

  const router = useRouter();
  const LightTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.white,
      color: "rgba(0, 0, 0, 0.87)",
      boxShadow: theme.shadows[1],
      fontSize: 11,
    },
  }));

  function selectAvatarFunc(element) {
    // console.log("call selectAvatarFunc()");
    // console.log("element.metadata: ", element.metadata);
    // console.log(
    //   "element.metadata.realbits.vrm_url: ",
    //   element.metadata.realbits.vrm_url
    // );

    setAvatarUrl(element.metadata.realbits.vrm_url);
  }

  function buildAvaChatService() {
    return (
      <>
        {/* //*----------------------------------------------------------------*/}
        {/* //* ChatMessage component.                                         */}
        {/* //*----------------------------------------------------------------*/}
        <ChatMessage
          setAvatarExpressionFuncRef={setAvatarExpressionFuncRef}
          setTalkFuncRef={setTalkFuncRef}
        />

        {/* //*----------------------------------------------------------------*/}
        {/* //* RentContent component.                                         */}
        {/* //*----------------------------------------------------------------*/}
        {/* <RentContent
          selectAvatarFunc={selectAvatarFunc}
          rentMarketAddress={
            process.env.NEXT_PUBLIC_RENT_MARKET_CONTRACT_ADDRESS
          }
          blockchainNetwork={process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK}
          testNftAddress={process.env.NEXT_PUBLIC_LOCAL_NFT_CONTRACT_ADDRESS}
          serviceAddress={process.env.NEXT_PUBLIC_SERVICE_OWNER_ADDRESS}
          openMyFuncRef={openMyFuncRef}
          openMarketFuncRef={openMarketFuncRef}
          rentMarketRef={rentMarketRef}
        /> */}

        {/*//*-----------------------------------------------------------------*/}
        {/*//* AvatarView component.                                           */}
        {/*//*-----------------------------------------------------------------*/}
        <AvatarView
          showGuideCanvas={false}
          showFrameStats={false}
          useMotionUpdate={false}
          inputGltfDataUrl={avatarUrl}
          getV3dCoreFuncRef={getV3dCoreFuncRef}
          getImageDataUrlFunc={getImageDataUrl}
          // VideoChat -> AvatarView call for new Remon.
          // TakeVideo -> AvatarView call for recording video.
          getMediaStreamFunc={getMediaStreamFuncRef}
          // VideoChat -> AvatarView call for changing avatar canvas position.
          // ScreenView -> AvatarView call for changing avatar canvas position.
          setAvatarPositionFunc={setAvatarPositionFuncRef}
          setAvatarExpressionFuncRef={setAvatarExpressionFuncRef}
          setTalkFuncRef={setTalkFuncRef}
          serviceMode={AVACHAT_MODE}
        />

        {/*//*-----------------------------------------------------------------*/}
        {/*//* Fab menu button.                                                */}
        {/*//*-----------------------------------------------------------------*/}
        {/* <ButtonMenu
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
        /> */}
      </>
    );
  }

  function buildAvaMeService() {
    return (
      <>
        {/* //*----------------------------------------------------------------*/}
        {/* //* RentContent component.                                         */}
        {/* //*----------------------------------------------------------------*/}
        <RentContent
          selectAvatarFunc={selectAvatarFunc}
          rentMarketAddress={
            process.env.NEXT_PUBLIC_RENT_MARKET_CONTRACT_ADDRESS
          }
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
          serviceMode={AVAME_MODE}
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
  }

  function buildAvaCloService() {
    return (
      <>
        <AvatarSelect />
      </>
    );
  }

  switch (SERVICE_MODE) {
    case "avame":
      return buildAvaMeService();

    case "avaclo":
      return buildAvaCloService();

    case "avachat":
    default:
      return buildAvaChatService();
  }
}
