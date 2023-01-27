import React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import TwitterIcon from "@mui/icons-material/Twitter";
import { AlertSeverity } from "rent-market";
import { RBDialog, RBSnackbar, isUserAllowed } from "./RealBitsUtil";
import Twitter from "./Twitter";

const TakePicture = ({
  getImageDataUrlFunc,
  takePictureFuncRef,
  rentMarketRef,
}) => {
  //----------------------------------------------------------------------------
  // Variables.
  //----------------------------------------------------------------------------
  const PICTURE_DIALOG_WIDTH = 500;
  const PICTURE_DIALOG_HEIGHT = 400;
  const ALLOW_MESSAGE = "You must own or rent NFT to use this function.";

  const [imageDataUrl, setImageDataUrl] = React.useState();
  const [openDialog, setOpenDialog] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState();
  const [windowHeight, setWindowHeight] = React.useState();
  const [showTwitterDialog, setShowTwitterDialog] = React.useState(false);

  //----------------------------------------------------------------------------
  // Handle toast mesage.
  //----------------------------------------------------------------------------
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

    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);

    takePictureFuncRef.current = takePicture;
  }, []);

  //----------------------------------------------------------------------------
  // Download picture function.
  //----------------------------------------------------------------------------
  const downloadImage = (url) => {
    // 1. Get the current time.
    const currentdate = new Date();
    const currentTime =
      currentdate.getFullYear() +
      (currentdate.getMonth() + 1).toString().padStart(2, "0") +
      currentdate.getDate().toString().padStart(2, "0") +
      currentdate.getHours().toString().padStart(2, "0") +
      currentdate.getMinutes().toString().padStart(2, "0") +
      currentdate.getSeconds().toString().padStart(2, "0");

    // 2. Make image download link.
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${currentTime}.png`;
    document.body.appendChild(a);

    // 3. Start download.
    a.click();

    // 4. Wait for 0.1 second.
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const takePicture = () => {
    // Get image data url from AvatarView component by calling function.
    const responseImageDataUrl = getImageDataUrlFunc.current();
    // Set image data url.
    setImageDataUrl(responseImageDataUrl);

    // Open picture dialog.
    setOpenDialog(true);
  };

  return (
    <>
      {/*--------------------------------------------------------------------*/}
      {/* Show picture card.                                                 */}
      {/*--------------------------------------------------------------------*/}
      <RBDialog
        inputOpenRBDialog={openDialog}
        inputSetOpenRBDialogFunc={setOpenDialog}
        inputRBDialogWidth={PICTURE_DIALOG_WIDTH}
        inputRBDialogHeight={PICTURE_DIALOG_HEIGHT}
        inputTitle={"Take a picture"}
        inputRight={5}
        inputTop={5}
      >
        <Card>
          {/*----------------------------------------------------------------*/}
          {/* Show card image.                                               */}
          {/*----------------------------------------------------------------*/}
          <CardMedia
            component="img"
            width={(windowWidth || 100) / 3}
            height={(windowHeight || 250) / 3}
            image={imageDataUrl}
            alt="Preview image"
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              You can download image picture by clicking file button below.
            </Typography>
          </CardContent>

          {/*----------------------------------------------------------------*/}
          {/* Show file download button.                                     */}
          {/*----------------------------------------------------------------*/}
          <CardActions disableSpacing>
            {/*--------------------------------------------------------------*/}
            {/* Download button.                                             */}
            {/*--------------------------------------------------------------*/}
            <IconButton
              aria-label="download"
              onClick={async () => {
                const response = await isUserAllowed({
                  rentMarket: rentMarketRef.current,
                });
                if (response === false) {
                  setSnackbarValue({
                    snackbarSeverity: AlertSeverity.info,
                    snackbarMessage: ALLOW_MESSAGE,
                    snackbarTime: new Date(),
                    snackbarOpen: true,
                  });
                  return;
                }

                downloadImage(imageDataUrl);
              }}
            >
              <DownloadIcon />
            </IconButton>

            {/*--------------------------------------------------------------*/}
            {/* Twitter upload button.                                       */}
            {/*--------------------------------------------------------------*/}
            <IconButton
              aria-label="twitter"
              onClick={async () => {
                // Check that user is allowed to upload image to twitter.
                // User has to rent or own NFT.
                const response = await isUserAllowed({
                  rentMarket: rentMarketRef.current,
                });

								// User does not have right to upload image to twitter.
                // TODOO: Test for a short time.
                // if (response === false) {
                //   setSnackbarValue({
                //     snackbarSeverity: AlertSeverity.info,
                //     snackbarMessage: ALLOW_MESSAGE,
                //     snackbarTime: new Date(),
                //     snackbarOpen: true,
                //   });
                //   return;
                // }

								// Show twitter dialog for uploading image.
                setShowTwitterDialog(true);
              }}
            >
              <TwitterIcon />
            </IconButton>
          </CardActions>
        </Card>
      </RBDialog>

      {/*--------------------------------------------------------------------*/}
      {/* Show twitter dialog.                                               */}
      {/*--------------------------------------------------------------------*/}
      <Twitter
        inputImageUrl={imageDataUrl}
        showTwitterDialog={showTwitterDialog}
        inputSetShowTwitterDialog={setShowTwitterDialog}
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
