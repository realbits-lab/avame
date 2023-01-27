import React from "react";
import Draggable from "react-draggable";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { Resizable } from "react-resizable";
import { atom, selector } from "recoil";
import { v4 as uuidv4, v1 } from "uuid";
import { AlertSeverity } from "rent-market";
import BootstrapDialogTitle, { Transition } from "./BootstrapDialogTitle";

export const PaperComponent = (props) => {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
};

export const ScreenPosition = {
  center: "center",
  rightTop: "rightTop",
  rightBottom: "rightBottom",
};

export const Z_INDEX = {
  loader: 5,
  avatarCanvasCenter: 10,
  avatarCanvasRightTop: 50,
  button: 100,
  dialog: 200,
};

export const RBDialog = ({
  inputOpenRBDialog,
  inputSetOpenRBDialogFunc,
  transitionComponent,
  keepMounted,
  inputRBDialogWidth,
  inputRBDialogHeight,
  inputTitle,
  inputLeft,
  inputRight,
  inputTop,
  inputBottom,
  children,
  inputFullScreen,
}) => {
  const DEFAULT_WIDTH = 600;
  const DEFAULT_HEIGHT = 400;

  // console.log("call RBDialog");
  // console.log("inputOpenRBDialog: ", inputOpenRBDialog);
  // console.log("inputTitle: ", inputTitle);
  const [openRBDialog, setOpenRBDialog] = React.useState(false);
  const [rbDialogWidth, setRBDialogWidth] = React.useState(0);
  const [rbDialogHeight, setRBDialogHeight] = React.useState(0);
  const [fullScreen, setFullScreen] = React.useState(false);
  const [title, setTitle] = React.useState(0);
  const [left, setLeft] = React.useState(0);
  const [right, setRight] = React.useState(0);
  const [bottom, setBottom] = React.useState(0);
  const [top, setTop] = React.useState(0);

  React.useEffect(() => {
    // console.log("call React.useEffect()");
    // console.log("inputOpenRBDialog: ", inputOpenRBDialog);
    // console.log("inputSetOpenRBDialogFunc: ", inputSetOpenRBDialogFunc);
    // console.log("inputTitle: ", inputTitle);
    // console.log("inputFullScreen: ", inputFullScreen);
    // console.log("inputRBDialogWidth: ", inputRBDialogWidth);
    // console.log("inputRBDialogHeight: ", inputRBDialogHeight);

    setOpenRBDialog(inputOpenRBDialog);
    setRBDialogWidth(inputRBDialogWidth);
    setRBDialogHeight(inputRBDialogHeight);
    setTitle(inputTitle);
    setLeft(inputLeft);
    setRight(inputRight);
    setTop(inputTop);
    setBottom(inputBottom);
    setFullScreen(inputFullScreen);
  }, [
    inputOpenRBDialog,
    inputSetOpenRBDialogFunc,
    transitionComponent,
    keepMounted,
    inputRBDialogWidth,
    inputRBDialogHeight,
    inputTitle,
    inputLeft,
    inputRight,
    inputTop,
    inputBottom,
    children,
  ]);

  return (
    <Dialog
      open={openRBDialog}
      onClose={() => {
        try {
          inputSetOpenRBDialogFunc(false);
        } catch (error) {
          console.error(error);
        }
      }}
      TransitionComponent={transitionComponent}
      keepMounted={keepMounted}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      aria-describedby="alert-dialog-slide-description"
      scroll="paper"
      fullScreen={fullScreen}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        style: {
          backgroundColor: "transparent",
        },
        sx: {
          width: { rbDialogWidth },
          height: { rbDialogHeight },
          position: "absolute",
          left: { left },
          right: { right },
          top: { top },
          bottom: { bottom },
          m: 0,
        },
      }}
    >
      <Resizable
        width={rbDialogWidth || DEFAULT_WIDTH}
        height={rbDialogHeight || DEFAULT_HEIGHT}
        onResize={(event, data) => {
          setRBDialogWidth(rbDialogWidth + event.movementX);
          setRBDialogHeight(rbDialogHeight + event.movementY);
        }}
      >
        <>
          <BootstrapDialogTitle
            onClose={() => {
              try {
                inputSetOpenRBDialogFunc(false);
              } catch (error) {
                console.error(error);
              }
            }}
            style={{ cursor: "move" }}
            id="draggable-dialog-title"
          >
            {title}
          </BootstrapDialogTitle>
          <DialogContent
            dividers={false}
            sx={{ width: `${rbDialogWidth}px`, height: `${rbDialogHeight}px` }}
          >
            {children}
          </DialogContent>
        </>
      </Resizable>
    </Dialog>
  );
};

export const writeToastMessageState = atom({
  key: `writeToastMessageState/${v1()}`,
  snackbarSeverity: AlertSeverity.info,
  snackbarMessage: "",
  // snackbarTime: new Date(),
  snackbarTime: "time",
  snackbarOpen: true,
});

export const readToastMessageState = selector({
  key: `readToastMessageState/${v1()}`,
  get: ({ get }) => {
    const toastMessageState = get(writeToastMessageState);
    return toastMessageState;
  },
});
