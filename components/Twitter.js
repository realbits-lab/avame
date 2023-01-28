import React from "react";
import axios from "axios";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import UploadIcon from "@mui/icons-material/Upload";
import { RBDialog } from "./RealBitsUtil";

// TODO: Check the double uploading.
const Twitter = ({
  showTwitterDialog,
  videoFile,
  inputImageUrl,
  inputSetShowTwitterDialog,
  inputPlainMessage,
  inputSignMessage,
  inputSignerAddress,
}) => {
  //*---------------------------------------------------------------------------
  //* Define constant variables.
  //*---------------------------------------------------------------------------
  const TWITTER_DIALOG_WIDTH = 500;
  const TWITTER_DIALOG_HEIGHT = 400;
  const TWITTER_AUTH_API_URL = "/api/twitter/auth";
  const TWITTER_IMAGE_UPLOAD_URL = "/api/twitter/upload_image";
  const TWITTER_VIDEO_UPLOAD_URL = "/api/twitter/upload_video";

  //*---------------------------------------------------------------------------
  //* Define hook variables.
  //*---------------------------------------------------------------------------
  const [videoUrl, setVideoUrl] = React.useState();
  const [imageUrl, setImageUrl] = React.useState("");
  const [twitterText, setTwitterText] = React.useState("");
  const [uploadTwitterEnabled, setUploadTwitterEnabled] = React.useState(false);
  const [ImageCardMedia, setImageCardMedia] = React.useState(null);
  const [VideoCardMedia, setVideoCardMedia] = React.useState(null);
  const [windowWidth, setWindowWidth] = React.useState();
  const [windowHeight, setWindowHeight] = React.useState();

  React.useEffect(() => {
    // console.log("call useEffect()");
    // console.log("showTwitterDialog: ", showTwitterDialog);
    // console.log("videoFile: ", videoFile);
    // console.log("inputImageUrl: ", inputImageUrl);
    // console.log("inputSetShowTwitterDialog: ", inputSetShowTwitterDialog);
    // console.log("window.innerWidth: ", window.innerWidth);
    // console.log("window.innerHeight: ", window.innerHeight);

    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);

    // Use only one of image and video.
    if (inputImageUrl !== undefined && showTwitterDialog === true) {
      setImageUrl(inputImageUrl);
      try {
        setImageCardMedia(
          <CardMedia
            component="img"
            width={(window.innerWidth || 100) / 3}
            height={(window.innerHeight || 250) / 3}
            image={inputImageUrl}
            alt="Preview image"
          />
        );
      } catch (error) {
        console.error(error);
      }
    } else if (videoFile !== undefined && showTwitterDialog === true) {
      try {
        setVideoCardMedia(
          <CardMedia
            width={(windowWidth || 100) / 3}
            height={(windowHeight || 250) / 3}
            component="video"
            // autoPlay
            controls
            src={videoUrl}
          />
        );
      } catch (error) {
        console.error(error);
      }
    }
  }, [showTwitterDialog, inputImageUrl, videoFile]);

  async function uploadImage({ url }) {
    console.log("call uploadImage()");
    // console.log("url: ", url);

    let axiosResponse;
    try {
      setUploadTwitterEnabled(false);

      //* Get image blob data.
      // https://stackoverflow.com/questions/12168909/blob-from-dataurl
      const fetchResult = await fetch(url);
      const blobResult = await fetchResult.blob();
      // console.log("blobResult: ", blobResult);

      //* Set form with image blob data for uploading.
      const formData = new FormData();
      formData.append("image_data", blobResult);
      formData.append("plain_message", inputPlainMessage);
      formData.append("sign_message", inputSignMessage);
      formData.append("signer_address", inputSignerAddress);

      //* Post image blob data with upload url.
      axiosResponse = await axios.post(TWITTER_IMAGE_UPLOAD_URL, formData);
      console.log("axiosResponse: ", axiosResponse);

      setUploadTwitterEnabled(true);
    } catch (error) {
      setUploadTwitterEnabled(true);
      throw error;
    }

    return axiosResponse.data.path;
  }

  async function uploadVideo() {
    // console.log("call uploadVideo()");
    // console.log("videoFile: ", videoFile);

    const formData = new FormData();
    formData.append("video_data", videoFile);
    formData.append("plain_message", inputPlainMessage);
    formData.append("sign_message", inputSignMessage);
    formData.append("signer_address", inputSignerAddress);

    setVideoUrl(window.URL.createObjectURL(videoFile));

    let axiosResponse;
    try {
      setUploadTwitterEnabled(false);

      axiosResponse = await axios.post(TWITTER_VIDEO_UPLOAD_URL, formData);
      // console.log("axiosResponse: ", axiosResponse);

      setUploadTwitterEnabled(true);
    } catch (error) {
      setUploadTwitterEnabled(true);
      throw error;
    }

    return axiosResponse.data.path;
  }

  // TODO: Set position of twitter dialog
  // TODO: Set size of twitter dialog.
  // TODO: Delete file when closing dialog.
  return (
    <div>
      <RBDialog
        inputOpenRBDialog={showTwitterDialog}
        inputSetOpenRBDialogFunc={inputSetShowTwitterDialog}
        inputRBDialogWidth={TWITTER_DIALOG_WIDTH}
        inputRBDialogHeight={TWITTER_DIALOG_HEIGHT}
        inputTitle={"Twitter Upload"}
        inputRight={5}
        inputTop={5}
      >
        <Card>
          {/*//*-------------------------------------------------------------*/}
          {/*//* Show image or video snapshot.                               */}
          {/*//*-------------------------------------------------------------*/}
          {ImageCardMedia}
          {VideoCardMedia}

          {/*//*-------------------------------------------------------------*/}
          {/*//* Show text input.                                            */}
          {/*//*-------------------------------------------------------------*/}
          <CardContent>
            <TextField
              fullWidth
              label="twitter text"
              id="fullWidth"
              size="small"
              placeholder="Write twitter"
              onChange={(event) => {
                setTwitterText(event.target.value);
              }}
            />
          </CardContent>

          {/*//*-------------------------------------------------------------*/}
          {/*//* Show twitter upload button.                                         */}
          {/*//*-------------------------------------------------------------*/}
          <CardActions disableSpacing>
            <IconButton
              aria-label="twitter"
              onClick={async function () {
                // console.log("call onClick()");

                let uploadResponse;
                try {
                  if (
                    inputImageUrl !== undefined &&
                    showTwitterDialog === true
                  ) {
                    uploadResponse = await uploadImage({
                      url: inputImageUrl,
                    });
                  } else if (
                    videoFile !== undefined &&
                    showTwitterDialog === true
                  ) {
                    uploadResponse = await uploadVideo();
                  }
                } catch (error) {
                  throw error;
                }

                if (uploadResponse.error || uploadResponse.path === undefined) {
                  console.error("Upload process is not valid.");
                  return;
                }

                const uploadedFilePath = uploadResponse.path;
                console.log("uploadedFilePath: ", uploadedFilePath);

                try {
                  const response = await axios.get(
                    `${TWITTER_AUTH_API_URL}?path=${uploadedFilePath}&twitterText=${twitterText}`
                  );
                  console.log("response: ", response);

                  if (response.status === 200) {
                    window.open(response.data.url);
                  } else {
                    // TODO: Handle response error.
                    console.error(response);
                  }
                } catch (error) {
                  throw error;
                }

                setUploadTwitterEnabled(false);
                inputSetShowTwitterDialog(false);
              }}
            >
              <UploadIcon />
            </IconButton>
          </CardActions>
        </Card>
      </RBDialog>
    </div>
  );
};

export default Twitter;
