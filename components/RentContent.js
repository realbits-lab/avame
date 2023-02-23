import React from "react";
import { Web3Button, Web3NetworkSwitch } from "@web3modal/react";
import Grid from "@mui/material/Grid";
import { useRecoilStateLoadable, useRecoilValueLoadable } from "recoil";
import { useAccount, useNetwork } from "wagmi";
import { RentMarket, RBSnackbar, AlertSeverity } from "rent-market";
import My from "./My";
import Market from "./Market";
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
  const { chain, chains } = useNetwork();
  const { address, isConnected } = useAccount();

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

    //* Initialize data before getting rent market class and data.
    onEventFunc();

    async function initRentMarket() {
      // console.log("rentMarketAddress: ", rentMarketAddress);
      rentMarket.current = new RentMarket({
        accountAddress: address,
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
    address,
    isConnected,
  ]);

  function onEventFunc(message) {
    // console.log("call onEventFunc()");

    if (rentMarket.current === undefined || rentMarket.current === null) {
      setMyRegisteredNFTArray(undefined);
      setMyUnregisteredNFTArray(undefined);
      setRegisterNFTArray(undefined);
      setMyRentNFTArray(undefined);
      setCollectionArray(undefined);
      setServiceArray(undefined);
      setTokenArray(undefined);
    } else {
      setMyRegisteredNFTArray(rentMarket.current.myRegisteredNFTArray);
      setMyUnregisteredNFTArray(rentMarket.current.myUnregisteredNFTArray);
      setRegisterNFTArray(rentMarket.current.registerNFTArray);
      setMyRentNFTArray(rentMarket.current.myRentNFTArray);
      setCollectionArray(rentMarket.current.collectionArray);
      setServiceArray(rentMarket.current.serviceArray);
      setTokenArray(rentMarket.current.tokenArray);
    }

    // console.log(
    //   "rentMarket.current.registerNFTArray: ",
    //   rentMarket.current.registerNFTArray
    // );
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
      //* TODO: Show toast message.
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
        inputTitle={"Avatar List"}
        transparent={true}
      >
        <Grid container direction="row" justifyContent="space-around">
          <Grid item>
            <Web3Button />
          </Grid>
          <Grid item>
            <Web3NetworkSwitch />
          </Grid>
        </Grid>
        <Market
          inputRentMarketClass={inputRentMarket}
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
        inputTitle={"My Avatar List"}
        transparent={true}
      >
        <Grid
          container
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
        >
          <Grid container direction="row" justifyContent="space-around">
            <Grid item>
              <Web3Button />
            </Grid>
            <Grid item>
              <Web3NetworkSwitch />
            </Grid>
          </Grid>
          <My
            selectAvatarFunc={selectAvatarFunc}
            inputRentMarket={inputRentMarket}
            inputCollectionArray={collectionArray}
            inputServiceAddress={serviceAddress}
            inputMyRegisteredNFTArray={myRegisteredNFTArray}
            inputMyRentNFTArray={myRentNFTArray}
            inputBlockchainNetwork={blockchainNetwork}
            setWriteToastMessage={setWriteToastMessage}
            selectedChain={chain}
            wagmiIsConnected={isConnected}
          />
        </Grid>
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
