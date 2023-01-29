import React from "react";
import { Web3Button, Web3NetworkSwitch } from "@web3modal/react";
import { useAccount } from "wagmi";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import DownloadIcon from "@mui/icons-material/Download";
import TwitterIcon from "@mui/icons-material/Twitter";
import {
  AlertSeverity,
  RBSnackbar,
  isUserAllowed,
  signMessage,
} from "rent-market";
import { RBDialog } from "./RealBitsUtil";
import Twitter from "./Twitter";

const TakePicture = ({
  getImageDataUrlFunc,
  takePictureFuncRef,
  rentMarketRef,
}) => {
  //*---------------------------------------------------------------------------
  //* Variables.
  //*---------------------------------------------------------------------------
  const { address, isConnected } = useAccount();
  const USER_NOT_ALLOW_MESSAGE =
    "Your account must own or rent NFT in polygon network. Check metamask wallet.";

  const [imageDataUrl, setImageDataUrl] = React.useState();
  const [openDialog, setOpenDialog] = React.useState(false);
  const [showTwitterDialog, setShowTwitterDialog] = React.useState(false);
  const [inputSignMessage, setInputSignMessage] = React.useState();
  const [inputPlainMessage, setInputPlainMessage] = React.useState();
  const [inputSignerAddress, setInputSignerAddress] = React.useState();

  //*---------------------------------------------------------------------------
  //* Handle toast mesage.
  //*---------------------------------------------------------------------------
  const [snackbarValue, setSnackbarValue] = React.useState({
    snackbarSeverity: AlertSeverity.info,
    snackbarMessage: "",
    snackbarTime: new Date(),
    snackbarOpen: true,
  });
  const { snackbarSeverity, snackbarMessage, snackbarTime, snackbarOpen } =
    snackbarValue;

  React.useEffect(() => {
    // console.log("call React.useEffect()");
    // console.log("window.innerWidth: ", window.innerWidth);
    // console.log("window.innerHeight: ", window.innerHeight);
    takePictureFuncRef.current = takePicture;
  }, [
    getImageDataUrlFunc,
    takePictureFuncRef,
    takePictureFuncRef.current,
    rentMarketRef,
    rentMarketRef.current,
  ]);

  //*---------------------------------------------------------------------------
  //* Download picture function.
  //*---------------------------------------------------------------------------
  function downloadImage(url) {
    //* Get the current time.
    const currentdate = new Date();
    const currentTime =
      currentdate.getFullYear() +
      (currentdate.getMonth() + 1).toString().padStart(2, "0") +
      currentdate.getDate().toString().padStart(2, "0") +
      currentdate.getHours().toString().padStart(2, "0") +
      currentdate.getMinutes().toString().padStart(2, "0") +
      currentdate.getSeconds().toString().padStart(2, "0");

    //* Make image download link.
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${currentTime}.png`;
    document.body.appendChild(a);

    //* Start download.
    a.click();

    //* Wait for 0.1 second.
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  function takePicture() {
    //* Get image data url from AvatarView component by calling function.
    const responseImageDataUrl = getImageDataUrlFunc.current();

    //* Set image data url.
    setImageDataUrl(responseImageDataUrl);

    //* Open picture dialog.
    setOpenDialog(true);
  }

  return (
    <>
      {/*//*-----------------------------------------------------------------*/}
      {/*//* Show picture card.                                              */}
      {/*//*-----------------------------------------------------------------*/}
      <RBDialog
        inputOpenRBDialog={openDialog}
        inputSetOpenRBDialogFunc={setOpenDialog}
        inputTitle={"Take a picture"}
      >
        <Grid
          container
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
        >
          <Grid container direction="row" justifyContent="space-around">
            <Web3Button />
            <Web3NetworkSwitch />
          </Grid>
          <Card sx={{ marginTop: "10px" }}>
            {/*//*-------------------------------------------------------------*/}
            {/*//* Show card image.                                            */}
            {/*//*-------------------------------------------------------------*/}
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                * You can download image or upload it to twitter.
              </Typography>
            </CardContent>

            {/*//*-------------------------------------------------------------*/}
            {/*//* Show file download button.                                  */}
            {/*//*-------------------------------------------------------------*/}
            <CardActions sx={{ justifyContent: "space-around" }}>
              {/*//*-----------------------------------------------------------*/}
              {/*//* Download button.                                          */}
              {/*//*-----------------------------------------------------------*/}
              <Button
                variant="contained"
                aria-label="download"
                onClick={async () => {
                  let response;
                  try {
                    response = await rentMarketRef.current.isOwnerOrRenter(
                      address
                    );
                  } catch (error) {
                    console.error(error);
                    setSnackbarValue({
                      snackbarSeverity: AlertSeverity.warning,
                      snackbarMessage: USER_NOT_ALLOW_MESSAGE,
                      snackbarTime: new Date(),
                      snackbarOpen: true,
                    });
                    return;
                  }
                  // console.log("response: ", response);

                  if (response === false) {
                    setSnackbarValue({
                      snackbarSeverity: AlertSeverity.warning,
                      snackbarMessage: USER_NOT_ALLOW_MESSAGE,
                      snackbarTime: new Date(),
                      snackbarOpen: true,
                    });
                    return;
                  }

                  downloadImage(imageDataUrl);
                }}
              >
                <DownloadIcon />
              </Button>

              {/*//*-----------------------------------------------------------*/}
              {/*//* Twitter upload button.                                    */}
              {/*//*-----------------------------------------------------------*/}
              <Button
                variant="contained"
                aria-label="twitter"
                onClick={async function () {
                  // console.log("call onClick()");

                  //* Check that user is allowed to upload image to twitter.
                  //* User has to rent or own NFT.
                  let response;
                  try {
                    response = await isUserAllowed({
                      rentMarket: rentMarketRef.current,
                    });
                  } catch (error) {
                    setSnackbarValue({
                      snackbarSeverity: AlertSeverity.warning,
                      snackbarMessage: USER_NOT_ALLOW_MESSAGE,
                      snackbarTime: new Date(),
                      snackbarOpen: true,
                    });
                    return;
                  }
                  // console.log("response: ", response);

                  //* User does not have right to upload image to twitter.
                  if (response === false) {
                    setSnackbarValue({
                      snackbarSeverity: AlertSeverity.warning,
                      snackbarMessage: USER_NOT_ALLOW_MESSAGE,
                      snackbarTime: new Date(),
                      snackbarOpen: true,
                    });
                    return;
                  }

                  //* Sign message.
                  const message =
                    "You sign this message for authenticating server.";
                  const signMessageResponse = await signMessage({
                    rentMarket: rentMarketRef.current,
                    message: message,
                  });
                  // console.log("signMessageResponse: ", signMessageResponse);
                  setInputPlainMessage(message);
                  setInputSignerAddress(rentMarketRef.current.signerAddress);
                  setInputSignMessage(signMessageResponse);

                  //* Show twitter dialog for uploading image.
                  setShowTwitterDialog(true);
                }}
              >
                <TwitterIcon />
              </Button>
            </CardActions>
            <CardMedia
              component="img"
              image={imageDataUrl}
              alt="Preview image"
            />
          </Card>
        </Grid>
      </RBDialog>

      {/*//*-----------------------------------------------------------------*/}
      {/*//* Show twitter dialog.                                            */}
      {/*//*-----------------------------------------------------------------*/}
      <Twitter
        inputImageUrl={imageDataUrl}
        showTwitterDialog={showTwitterDialog}
        inputSetShowTwitterDialog={setShowTwitterDialog}
        inputPlainMessage={inputPlainMessage}
        inputSignMessage={inputSignMessage}
        inputSignerAddress={inputSignerAddress}
      />

      <RBSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        currentTime={snackbarTime}
      />
    </>
  );
};

export default TakePicture;
