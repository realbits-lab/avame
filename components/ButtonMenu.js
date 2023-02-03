import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Fab from "@mui/material/Fab";
import { styled } from "@mui/system";
import { tooltipClasses } from "@mui/material/Tooltip";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import {
  humanFileSize,
  RBSnackbar,
  AlertSeverity,
  isUserAllowed,
} from "rent-market";

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

const ButtonMenu = ({
  useFab = false,
  takePictureFuncRef,
  startRecordingFuncRef,
  stopRecordingFuncRef,
  getRecordStatusFuncRef,
  requestDataFuncRef,
  startScreenStreamFuncRef,
  stopScreenStreamFuncRef,
  openMyFuncRef,
  openMarketFuncRef,
  stopScreenEventFuncRef,
  rentMarketRef,
}) => {
  //*---------------------------------------------------------------------------
  //* Variables.
  //*---------------------------------------------------------------------------
  const fabActions = [
    { icon: <PersonIcon color="primary" />, name: "My" },
    { icon: <StorefrontIcon color="primary" />, name: "Market" },
    // { icon: <ScreenShareIcon color="secondary" />, name: "Screen" },
    // { icon: <OndemandVideoIcon color="secondary" />, name: "Video" },
    { icon: <CameraAltIcon color="primary" />, name: "Image" },
  ];
  //* TODO: For testing, set default status to true.
  const [openSpeedDial, setOpenSpeedDial] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isScreenShare, setIsScreenShare] = React.useState(false);
  const [recordSize, setRecordSize] = React.useState(0);
  const [recordTime, setRecordTime] = React.useState(0);
  const [sizeProgress, setSizeProgress] = React.useState(0);
  const intervalFuncRef = React.useRef();
  //* Set max record data size to 1GB.
  const MAX_RECORD_SIZE = 1000000000;
  const ALLOW_MESSAGE = "You must own or rent NFT to use this function.";

  //*---------------------------------------------------------------------------
  //* Handle toast mesage.
  //* TODO: Use recoil.
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
    stopScreenEventFuncRef.current = stopScreenEvent;
  });

  function stopScreenEvent() {
    setIsScreenShare(false);
  }

  function getRecordStatus() {
    requestDataFuncRef.current();
    const response = getRecordStatusFuncRef.current();
    // console.log("response: ", response);
    setRecordSize(response.size);
    setRecordTime(Math.round(response.time));
    setSizeProgress(Math.round(recordSize / MAX_RECORD_SIZE));

    if (response.size > MAX_RECORD_SIZE) {
      stopRecordingFuncRef.current();
      setIsRecording(false);
      clearInterval(intervalFuncRef.current);
    }
  }

  function CircularProgressWithLabel(props) {
    return (
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress variant="determinate" {...props} />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" component="div" color="text.secondary">
            {`${Math.round(props.value)}%`}
          </Typography>
        </Box>
      </Box>
    );
  }

  function FabMenu() {
    return (
      <>
        <SpeedDial
          ariaLabel="FAB button"
          sx={{ position: "absolute", bottom: 16, right: 16 }}
          icon={<SpeedDialIcon color="secondary" />}
          //* Mouse click event.
          onClick={(event) => {
            event.stopPropagation();
            // console.log("onClick");
            setOpenSpeedDial(true);
          }}
          onClose={(event) => {
            event.stopPropagation();
            // console.log("onClose");
            setOpenSpeedDial(false);
          }}
          open={openSpeedDial}
        >
          {fabActions.map((action) => {
            //* Check video and screen status.
            let isDisabled = false;
            if (action.name === "Video" && isRecording === true) {
              isDisabled = true;
            } else if (action.name === "Screen" && isScreenShare === true) {
              isDisabled = true;
            } else {
              isDisabled = false;
            }

            //* Show speed dial action button (FAB).
            return (
              <SpeedDialAction
                key={action.name}
                icon={action.icon}
                tooltipTitle={action.name}
                disabled={isDisabled}
                onClick={async (event) => {
                  if (action.name === "Image") {
                    takePictureFuncRef.current();
                  } else if (action.name === "Video") {
                    startRecordingFuncRef.current();
                    setIsRecording(true);
                    // Call every 1 second.
                    intervalFuncRef.current = setInterval(() => {
                      getRecordStatus();
                    }, 1000);
                  } else if (action.name === "Screen") {
                    await startScreenStreamFuncRef.current();
                    setIsScreenShare(true);
                  } else if (action.name === "My") {
                    openMyFuncRef.current();
                  } else if (action.name === "Market") {
                    openMarketFuncRef.current();
                  }

                  event.stopPropagation();
                }}
              />
            );
          })}
        </SpeedDial>

        {/*//*--------------------------------------------------------------*/}
        {/*//* Stop button.                                                 */}
        {/*//*--------------------------------------------------------------*/}
        <Box
          sx={{
            zIndex: 300,
            position: "absolute",
            right: "10px",
            top: "10px",
            width: "200px",
            height: "200px",
          }}
        >
          <Stack direction="row" justifyContent="flex-end">
            {isRecording ? (
              <Stack direction="column" justifyContent="flex-end">
                <IconButton
                  color="error"
                  onClick={() => {
                    stopRecordingFuncRef.current();
                    setIsRecording(false);
                    clearInterval(intervalFuncRef.current);
                  }}
                >
                  <OndemandVideoIcon color="secondary" />
                </IconButton>
                <Typography
                  variant="caption"
                  component="div"
                  color="text.secondary"
                >
                  size: {humanFileSize(recordSize)}
                </Typography>
                <Typography
                  variant="caption"
                  component="div"
                  color="text.secondary"
                >
                  time: {recordTime}
                </Typography>
              </Stack>
            ) : (
              <Grid item />
            )}
            {isScreenShare ? (
              <IconButton
                color="error"
                onClick={() => {
                  stopScreenStreamFuncRef.current();
                  setIsScreenShare(false);
                }}
              >
                <ScreenShareIcon color="secondary" />
              </IconButton>
            ) : (
              <Grid item />
            )}
          </Stack>
        </Box>
      </>
    );
  }

  function ButtonMenu() {
    return (
      <>
        <Box
          sx={{
            zIndex: 100,
            position: "absolute",
            top: 0,
            right: 0,
            m: 1,
            p: 1,
          }}
          display="flex"
          flexDirection="column"
          justifyContent="flex-end"
          alignItems="flex-end"
        >
          {/*//*--------------------------------------------------------------*/}
          {/*//* My menu.                                                     */}
          {/*//*--------------------------------------------------------------*/}
          <Fab
            color="primary"
            onClick={() => {
              openMyFuncRef.current();
            }}
            sx={{ m: 1 }}
          >
            <LightTooltip title="My Content" placement="left">
              <PersonIcon color="secondary" />
            </LightTooltip>
          </Fab>

          {/*//*--------------------------------------------------------------*/}
          {/*//* Market menu.                                                 */}
          {/*//*--------------------------------------------------------------*/}
          <Fab
            color="primary"
            onClick={() => {
              openMarketFuncRef.current();
            }}
            sx={{ m: 1 }}
          >
            <LightTooltip title="Content Market" placement="left">
              <StorefrontIcon color="secondary" />
            </LightTooltip>
          </Fab>

          {/*//*--------------------------------------------------------------*/}
          {/*//* Screen share menu.                                           */}
          {/*//*--------------------------------------------------------------*/}
          {isScreenShare ? (
            <Fab
              color="error"
              onClick={async () => {
                stopScreenStreamFuncRef.current();
                setIsScreenShare(false);
              }}
              sx={{ m: 1 }}
            >
              <ScreenShareIcon color="secondary" />
            </Fab>
          ) : (
            <Fab
              color="primary"
              onClick={async () => {
                // console.log("rentMarketRef.current: ", rentMarketRef.current);

								//* TODO: Put address.
                const response = await isUserAllowed({
                  rentMarket: rentMarketRef.current,
                });

                // TODO: Show user market dialog help message with picture.
                if (response === false) {
                  setSnackbarValue({
                    snackbarSeverity: AlertSeverity.error,
                    snackbarMessage: ALLOW_MESSAGE,
                    snackbarTime: new Date(),
                    snackbarOpen: true,
                  });

                  return;
                }

                await startScreenStreamFuncRef.current();
                setIsScreenShare(true);
              }}
              sx={{ m: 1 }}
            >
              <LightTooltip title="Screen Share" placement="left">
                <ScreenShareIcon color="secondary" />
              </LightTooltip>
            </Fab>
          )}

          {/*//*--------------------------------------------------------------*/}
          {/*//* Image snapshot menu.                                         */}
          {/*//*--------------------------------------------------------------*/}
          <Stack
            display="flex"
            flexDirection="column"
            justifyContent="flex-end"
            alignItems="flex-end"
          >
            <Fab
              color="primary"
              onClick={() => {
                takePictureFuncRef.current();
              }}
              sx={{ m: 1 }}
            >
              <LightTooltip title="Image Download" placement="left">
                <CameraAltIcon color="secondary" />
              </LightTooltip>
            </Fab>
          </Stack>

          {/*//*--------------------------------------------------------------*/}
          {/*//* Video snapshot menu.                                         */}
          {/*//*--------------------------------------------------------------*/}
          {isRecording ? (
            <Stack
              display="flex"
              flexDirection="column"
              justifyContent="flex-end"
              alignItems="flex-end"
            >
              <Fab
                color="warning"
                onClick={() => {
                  stopRecordingFuncRef.current();
                  setIsRecording(false);
                  clearInterval(intervalFuncRef.current);
                }}
                sx={{ m: 1 }}
              >
                <OndemandVideoIcon color="secondary" />
              </Fab>
              <Typography
                variant="caption"
                component="div"
                color="text.secondary"
              >
                size: {humanFileSize(recordSize)}
              </Typography>
              <Typography
                variant="caption"
                component="div"
                color="text.secondary"
              >
                time: {recordTime}s
              </Typography>
            </Stack>
          ) : (
            <Fab
              color="primary"
              onClick={() => {
                startRecordingFuncRef.current();
                setIsRecording(true);
                // Call every 1 second.
                intervalFuncRef.current = setInterval(() => {
                  getRecordStatus();
                }, 1000);
              }}
              sx={{ m: 1 }}
            >
              <LightTooltip title="Video Download" placement="left">
                <OndemandVideoIcon color="secondary" />
              </LightTooltip>
            </Fab>
          )}
        </Box>

        <RBSnackbar
          open={snackbarOpen}
          message={snackbarMessage}
          severity={snackbarSeverity}
          currentTime={snackbarTime}
        />
      </>
    );
  }

  return useFab === true ? <FabMenu /> : <ButtonMenu />;
};

export default ButtonMenu;
