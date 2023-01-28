import React from "react";
import { useRecoilStateLoadable, useRecoilValueLoadable } from "recoil";
import { useWeb3ModalNetwork } from "@web3modal/react";
import { useAccount } from "wagmi";
import { My, Market, RentMarket, RBSnackbar, AlertSeverity } from "rent-market";
import "../node_modules/react-resizable/css/styles.css";
import {
  RBDialog,
  writeToastMessageState,
  readToastMessageState,
} from "./RealBitsUtil";

const RentContent = ({
  selectAvatarFunc,
  rentMarketAddress,
  blockchainNetwork,
  testNftAddress,
  serviceAddress,
  openMyFuncRef,
  openMarketFuncRef,
  rentMarketRef,
}) => {
  //* --------------------------------------------------------------------------
  //* Web3 hook variables.
  //* --------------------------------------------------------------------------
  const { selectedChain, setSelectedChain } = useWeb3ModalNetwork();
  // console.log("selectedChain: ", selectedChain);
  const { address, isConnected } = useAccount();
  // console.log("address: ", address);
  // console.log("isConnected: ", isConnected);

  //* --------------------------------------------------------------------------
  //* Rent market variables.
  //* If undefined, it would be a loading status.
  //* --------------------------------------------------------------------------
  const rentMarket = React.useRef();
  const [myRegisteredNFTArray, setMyRegisteredNFTArray] = React.useState([]);
  const [myUnregisteredNFTArray, setMyUnregisteredNFTArray] = React.useState(
    []
  );
  const [collectionArray, setCollectionArray] = React.useState([]);
  const [serviceArray, setServiceArray] = React.useState([]);
  const [tokenArray, setTokenArray] = React.useState([]);
  const [inputRentMarket, setInputRentMarket] = React.useState();
  const [registerNFTArray, setRegisterNFTArray] = React.useState();
  const [myRentNFTArray, setMyRentNFTArray] = React.useState();

  //* --------------------------------------------------------------------------
  //* Dialog variables.
  //* --------------------------------------------------------------------------
  const [openMyDialog, setOpenMyDialog] = React.useState(false);
  const [openMarketDialog, setOpenMarketDialog] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState();
  const [windowHeight, setWindowHeight] = React.useState();

  //* --------------------------------------------------------------------------
  //* Snackbar variables.
  //* --------------------------------------------------------------------------
  const [writeToastMessageLoadable, setWriteToastMessage] =
    useRecoilStateLoadable(writeToastMessageState);
  const writeToastMessage =
    writeToastMessageLoadable?.state === "hasValue"
      ? writeToastMessageLoadable.contents
      : {
          snackbarSeverity: AlertSeverity.info,
          snackbarMessage: "",
          snackbarTime: new Date(),
          snackbarOpen: true,
        };

  const readToastMessageLoadable = useRecoilValueLoadable(
    readToastMessageState
  );
  const readToastMessage =
    readToastMessageLoadable?.state === "hasValue"
      ? readToastMessageLoadable.contents
      : {
          snackbarSeverity: AlertSeverity.info,
          snackbarMessage: "",
          snackbarTime: new Date(),
          snackbarOpen: true,
        };

  React.useEffect(() => {
    // console.log("call useEffect()");

    async function initRentMarket() {
      // console.log("rentMarketAddress: ", rentMarketAddress);
      rentMarket.current = new RentMarket({
        rentMarketAddress,
        testNftAddress,
        blockchainNetwork,
        onEventFunc,
        setWriteToastMessage,
      });

      // console.log("rentMarket.current: ", rentMarket.current);
      setInputRentMarket(rentMarket.current);
      try {
        await rentMarket.current.initializeAll();
      } catch (error) {
        console.error(error);
      }
      rentMarketRef.current = rentMarket.current;
      // console.log("rentMarketRef.current: ", rentMarketRef.current);
    }

    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);
    window.addEventListener("resize", () => {
      // console.log("-- resize event");
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    });

    openMyFuncRef.current = openMy;
    openMarketFuncRef.current = openMarket;

    // Fetch token, service, request/register data, and rent data to interconnect them.
    initRentMarket();
  }, [
    selectAvatarFunc,
    rentMarketAddress,
    blockchainNetwork,
    testNftAddress,
    serviceAddress,
    openMyFuncRef,
    openMarketFuncRef,
  ]);

  function onEventFunc(message) {
    // Set data.
    // console.log("call onEventFunc()");

    setMyRegisteredNFTArray(rentMarket.current.myRegisteredNFTArray);
    setMyUnregisteredNFTArray(rentMarket.current.myUnregisteredNFTArray);
    setRegisterNFTArray(rentMarket.current.registerNFTArray);
    setMyRentNFTArray(rentMarket.current.myRentNFTArray);
    setCollectionArray(rentMarket.current.collectionArray);
    setServiceArray(rentMarket.current.serviceArray);
    setTokenArray(rentMarket.current.tokenArray);

    // console.log(
    //   "rentMarket.current.myRentNFTArray: ",
    //   rentMarket.current.myRentNFTArray
    // );
    // console.log(
    //   "rentMarket.current.collectionArray: ",
    //   rentMarket.current.collectionArray
    // );

    if (message) {
      // console.log("message: ", message);
      // TODO: Show toast message.
    }
  }

  function openMy() {
    // console.log("call openMy()");
    setOpenMyDialog(true);
  }

  function openMarket() {
    setOpenMarketDialog(true);
  }

  return (
    <div>
      {/*//*-----------------------------------------------------------------*/}
      {/*//*  Show market content list.                                      */}
      {/*//*-----------------------------------------------------------------*/}
      <RBDialog
        inputOpenRBDialog={openMarketDialog}
        inputSetOpenRBDialogFunc={setOpenMarketDialog}
        inputRBDialogWidth={windowWidth}
        inputRBDialogHeight={windowHeight}
        inputTitle={"Avatar List"}
        inputFullScreen={true}
      >
        <Market
          inputRentMarket={inputRentMarket}
          inputCollectionArray={collectionArray}
          inputServiceAddress={serviceAddress}
          inputRegisterNFTArray={registerNFTArray}
          inputBlockchainNetwork={blockchainNetwork}
          setWriteToastMessage={setWriteToastMessage}
        />
      </RBDialog>

      {/*//*-----------------------------------------------------------------*/}
      {/*//* Show my content list.                                           */}
      {/*//*-----------------------------------------------------------------*/}
      <RBDialog
        inputOpenRBDialog={openMyDialog}
        inputSetOpenRBDialogFunc={setOpenMyDialog}
        inputRBDialogWidth={windowWidth}
        inputRBDialogHeight={windowHeight}
        inputTitle={"My Avatar List"}
        inputFullScreen={true}
      >
        <My
          selectAvatarFunc={selectAvatarFunc}
          inputRentMarket={inputRentMarket}
          inputCollectionArray={collectionArray}
          inputServiceAddress={serviceAddress}
          inputMyRegisteredNFTArray={myRegisteredNFTArray}
          inputMyRentNFTArray={myRentNFTArray}
          inputBlockchainNetwork={blockchainNetwork}
          setWriteToastMessage={setWriteToastMessage}
          web3modalSelectedChain={selectedChain}
          wagmiIsConnected={address}
        />
      </RBDialog>

      {/*//*-----------------------------------------------------------------*/}
      {/*//* Toast message.                                                  */}
      {/*//*-----------------------------------------------------------------*/}
      <RBSnackbar
        open={readToastMessage.snackbarOpen}
        message={readToastMessage.snackbarMessage}
        severity={readToastMessage.snackbarSeverity}
        currentTime={readToastMessage.snackbarTime}
      />
    </div>
  );
};

export default RentContent;
