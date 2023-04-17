import React from "react";
import { isMobile } from "react-device-detect";
import {
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
  useWatchPendingTransactions,
} from "wagmi";
import { useRecoilStateLoadable } from "recoil";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
  isWalletConnected,
  AlertSeverity,
  writeToastMessageState,
} from "./RealBitsUtil";
import rentmarketABI from "../contracts/rentMarket.json";

function RentNft({ imageUrl, nftAddress, tokenId }) {
  // console.log("call RentNft()");

  //*---------------------------------------------------------------------------
  //* Define constant variables.
  //*---------------------------------------------------------------------------
  const RENT_MARKET_CONTRACT_ADDRES =
    process.env.NEXT_PUBLIC_RENT_MARKET_CONTRACT_ADDRESS;
  const SERVICE_OWNER_ADDRESS = process.env.NEXT_PUBLIC_SERVICE_OWNER_ADDRESS;

  //* Wagmi hook functions.
  const {
    data: dataGetRegisterData,
    isError: isErrorGetRegisterData,
    isLoading: isLoadingGetRegisterData,
    status: statusGetRegisterData,
  } = useContractRead({
    address: RENT_MARKET_CONTRACT_ADDRES,
    abi: rentmarketABI.abi,
    functionName: "getRegisterData",
    args: [nftAddress, tokenId],
    cacheOnBlock: true,
    // watch: true,
    onSuccess(data) {
      // console.log("call onSuccess()");
      // console.log("data: ", data);
    },
    onError(error) {
      // console.log("call onError()");
      // console.log("error: ", error);
    },
    onSettled(data, error) {
      // console.log("call onSettled()");
      // console.log("data: ", data);
      // console.log("error: ", error);
    },
  });

  const { config, error } = usePrepareContractWrite({
    address: RENT_MARKET_CONTRACT_ADDRES,
    abi: rentmarketABI.abi,
    functionName: "rentNFT",
    args: [nftAddress, tokenId, SERVICE_OWNER_ADDRESS],
  });
  const contractWrite = useContractWrite(config);

  //* Wait for transactions.
  const waitForTransaction = useWaitForTransaction({
    hash: contractWrite.data?.hash,
    onSuccess(data) {
      // console.log("call onSuccess()");
      // console.log("data: ", data);
    },
    onError(error) {
      // console.log("call onSuccess()");
      // console.log("error: ", error);
    },
    onSettled(data, error) {
      setWriteToastMessage({
        snackbarSeverity: AlertSeverity.info,
        snackbarMessage: "Renting is finished.",
        snackbarTime: new Date(),
        snackbarOpen: true,
      });
      setIsRenting(false);
      // console.log("call onSettled()");
      // console.log("data: ", data);
      // console.log("error: ", error);
      // console.log("readRentingData: ", readRentingData);
    },
  });
  // console.log("waitForTransaction: ", waitForTransaction);
  // console.log("waitForTransaction.data: ", waitForTransaction.data);
  // console.log("waitForTransaction.status: ", waitForTransaction.status);

  //* Get pending transactions.
  useWatchPendingTransactions({
    listener: function (tx) {
      // console.log("tx: ", tx);
    },
  });

  const [isRenting, setIsRenting] = React.useState(false);

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

  // console.log("dataGetRegisterData: ", dataGetRegisterData);

  return (
    <Card>
      <CardMedia
        component="img"
        image={imageUrl}
        sx={{
          objectFit: "contain",
          width: "90vw",
        }}
      />
      <CardContent
        sx={{
          width: "90vw",
        }}
      >
        <Typography
          sx={{ fontSize: 14 }}
          color="text.secondary"
          gutterBottom
        ></Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          variant="contained"
          onClick={async () => {
            console.log("call onClick()");
            console.log("nftAddress: ", nftAddress);
            console.log("tokenId: ", tokenId);
            console.log("rentFee: ", dataGetRegisterData.rentFee);

            //* Handle usePrepareContractWrite error.
            if (error) {
              console.log("error: ", error);
              setWriteToastMessage({
                snackbarSeverity: AlertSeverity.warning,
                snackbarMessage: `Error: ${
                  error.data ? error.data.message : error.message
                }`,
                snackbarTime: new Date(),
                snackbarOpen: true,
              });
              return;
            }

            if (isWalletConnected({ isConnected, selectedChain }) === false) {
              console.log("isConnected: ", isConnected);
              console.log("selectedChain: ", selectedChain);
              setWriteToastMessage({
                snackbarSeverity: AlertSeverity.warning,
                snackbarMessage: `Change blockchain network to ${process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK}`,
                snackbarTime: new Date(),
                snackbarOpen: true,
              });
              return;
            }

            if (!rentMarketContract || !dataSigner) {
              console.log("rentMarketContract: ", rentMarketContract);
              console.log("dataSigner: ", dataSigner);

              console.error(
                "rentMarketContract or signer is null or undefined."
              );
              return;
            }

            setWriteToastMessage({
              snackbarSeverity: AlertSeverity.info,
              snackbarMessage: "Trying to rent this nft...",
              snackbarTime: new Date(),
              snackbarOpen: true,
            });

            try {
              setIsRenting(true);

              // console.log("contractWrite: ", contractWrite);
              const tx = await contractWrite.writeAsync({
                recklesslySetUnpreparedOverrides: {
                  value: dataGetRegisterData.rentFee,
                },
              });
              // console.log("tx: ", tx);
            } catch (error) {
              console.error("error: ", error);
              setWriteToastMessage({
                snackbarSeverity: AlertSeverity.error,
                snackbarMessage: error.data
                  ? error.data.message
                  : error.message,
                snackbarTime: new Date(),
                snackbarOpen: true,
              });
              setIsRenting(false);
              return;
            }

            setWriteToastMessage({
              snackbarSeverity: AlertSeverity.info,
              snackbarMessage:
                "Rent transaction is just started and wait a moment...",
              snackbarTime: new Date(),
              snackbarOpen: true,
            });
          }}
        >
          RENT
        </Button>
      </CardActions>
    </Card>
  );
}

export default RentNft;
