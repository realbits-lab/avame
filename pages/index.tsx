import React from "react";
import {
  EthereumClient,
  modalConnectors,
  walletConnectProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { polygon, polygonMumbai, localhost } from "wagmi/chains";
import AvatarView from "../components/AvatarView";
import TakePicture from "../components/TakePicture";
import RentContent from "../components/RentContent";
import ButtonMenu from "../components/ButtonMenu";
import VideoChat from "../components/VideoChat";
import { getChainName } from "../components/RealBitsUtil";

const Service = () => {
  //*---------------------------------------------------------------------------
  //* Constant variables.
  //*---------------------------------------------------------------------------
  const [avatarUrl, setAvatarUrl] = React.useState("default.vrm");

  //*---------------------------------------------------------------------------
  //* Variable references.
  //*---------------------------------------------------------------------------
  const rentMarketRef = React.useRef();

  //*---------------------------------------------------------------------------
  //* Function references.
  //*---------------------------------------------------------------------------
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

  let chains: any[] = [];
  if (
    getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK }) ===
    "matic"
  ) {
    chains = [polygon];
  } else if (
    getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK }) ===
    "maticmum"
  ) {
    chains = [polygonMumbai];
  } else if (
    getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK }) ===
    "localhost"
  ) {
    chains = [localhost];
  } else {
    chains = [];
  }

  // * Wagmi client
  const { provider } = configureChains(chains, [
    walletConnectProvider({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
    }),
  ]);
  const wagmiClient = createClient({
    autoConnect: true,
    connectors: modalConnectors({ appName: "web3Modal", chains }),
    provider,
  });

  // * Web3Modal Ethereum Client
  const ethereumClient = new EthereumClient(wagmiClient, chains);

  function selectAvatarFunc(element: {
    metadata: {
      realbits: {
        glb_url: React.SetStateAction<string>;
        vrm_url: React.SetStateAction<string>;
      };
    };
  }) {
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
      <WagmiConfig client={wagmiClient}>
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
          gltfDataUrl={avatarUrl}
          getImageDataUrlFunc={getImageDataUrl}
          // VideoChat -> AvatarView call for new Remon.
          // TakeVideo -> AvatarView call for recording video.
          getMediaStreamFunc={getMediaStreamFuncRef}
          // VideoChat -> AvatarView call for changing avatar canvas position.
          // ScreenView -> AvatarView call for changing avatar canvas position.
          setTransformAvatarFunc={setTransformAvatarFuncRef}
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
          inputSetTransformAvatarFuncRef={setTransformAvatarFuncRef}
          // ScreenView -> VideoChat call for setting background screen.
          inputSetBackgroundScreenFuncRef={setBackgroundScreenFuncRef}
          rentMarketRef={rentMarketRef}
        />
      </WagmiConfig>

      <Web3Modal
        projectId={process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}
        ethereumClient={ethereumClient}
        themeZIndex={20000}
      />
    </>
  );
};

export default Service;
