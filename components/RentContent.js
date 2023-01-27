import React from "react";
import { useRecoilStateLoadable, useRecoilValueLoadable } from "recoil";
import { RentMarket } from "rent-market";
import "../node_modules/react-resizable/css/styles.css";
import My from "./My";
import Market from "./Market";
import {
  RBDialog,
  RBSnackbar,
  AlertSeverity,
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
  //* Dialog open/close status.
  //* --------------------------------------------------------------------------
  // https://tkdodo.eu/blog/putting-props-to-use-state
  const [openMyDialog, setOpenMyDialog] = React.useState(false);
  const [openMarketDialog, setOpenMarketDialog] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState();
  const [windowHeight, setWindowHeight] = React.useState();

  //* --------------------------------------------------------------------------
  //* Rent market variables.
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

  //* If undefined, it'd loading status.
  const [registerNFTArray, setRegisterNFTArray] = React.useState();
  const [myRentNFTArray, setMyRentNFTArray] = React.useState();

  //* --------------------------------------------------------------------------
  //* Handle toast message.
  //* --------------------------------------------------------------------------
  const [writeToastMessageLoadable, setWriteToastMessage] =
    useRecoilStateLoadable(writeToastMessageState);
  const writeToastMessage = React.useMemo(() => {
    return writeToastMessageLoadable?.state === "hasValue"
      ? writeToastMessageLoadable.contents
      : {
          snackbarSeverity: AlertSeverity.info,
          snackbarMessage: "",
          snackbarTime: new Date(),
          snackbarOpen: true,
        };
  });

  const readToastMessageLoadable = useRecoilValueLoadable(
    readToastMessageState
  );
  const readToastMessage = React.useMemo(() => {
    return readToastMessageLoadable?.state === "hasValue"
      ? readToastMessageLoadable.contents
      : {
          snackbarSeverity: AlertSeverity.info,
          snackbarMessage: "",
          snackbarTime: new Date(),
          snackbarOpen: true,
        };
  });

  //* --------------------------------------------------------------------------
  //* Initialize data.
  //* --------------------------------------------------------------------------
  React.useEffect(() => {
    // console.log("call React.useEffect() with condition");

    const initRentMarket = async () => {
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
    };

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

  const onEventFunc = (message) => {
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
  };

  const openMy = () => {
    // console.log("call openMy()");
    setOpenMyDialog(true);
  };

  const openMarket = () => {
    setOpenMarketDialog(true);
  };

  // console.log("Build RentContent component.");

  return (
    <div>
      {/* //*----------------------------------------------------------------*/}
      {/* //* Show market content list.                                      */}
      {/* //*----------------------------------------------------------------*/}
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
        />
      </RBDialog>

      {/* //*----------------------------------------------------------------*/}
      {/* //* Show my content list.                                          */}
      {/* //*----------------------------------------------------------------*/}
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
        />
      </RBDialog>

      {/* //*----------------------------------------------------------------*/}
      {/* //* Toast message.                                                 */}
      {/* //*----------------------------------------------------------------*/}
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
