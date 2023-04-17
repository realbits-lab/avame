import React from "react";
import { Web3Button, Web3NetworkSwitch } from "@web3modal/react";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/system";
import { useRecoilStateLoadable, useRecoilValueLoadable } from "recoil";
import { useAccount, useNetwork } from "wagmi";
import { RentMarket, RBSnackbar, AlertSeverity, Market, My } from "rent-market";
import {
  RBDialog,
  writeToastMessageState,
  readToastMessageState,
} from "./RealBitsUtil";
import AvatarSelect from "./AvatarSelect";

const Main = styled("main", {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  flexGrow: 1,
  overflow: "scroll",
  padding: theme.spacing(1),
  // marginLeft: `-${RENT_CONTENT_COMPONENT_DRAWER_WIDTH}px`,
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

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
  const [openClothDialog, setOpenClothDialog] = React.useState(false);
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
    // console.log("rentMarket.current: ", rentMarket.current);
    // console.log(
    //   "rentMarket.current.collectionArray: ",
    //   rentMarket.current.collectionArray
    // );

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

  function openCloth() {
    setOpenClothDialog(true);
  }

  return (
    <div>
      {/*//*-----------------------------------------------------------------*/}
      {/*//*  Show cloth content list.                                      */}
      {/*//*-----------------------------------------------------------------*/}
      <RBDialog
        inputOpenRBDialog={openClothDialog}
        inputSetOpenRBDialogFunc={setOpenClothDialog}
        inputTitle={"Select Cloth"}
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
        <AvatarSelect />
      </RBDialog>

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
          web3modalSelectedChain={chain}
          wagmiIsConnected={isConnected}
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
