import React, { Component, useEffect, useState } from "react";
import {
  Alert,
  AppBar,
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  Fab,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Stack,
  Toolbar,
  useScrollTrigger,
  Zoom,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { Color, ColorBox, ColorValue, createColor } from "mui-color";
import { V3DWeb } from "v3d-web/dist/src";

const drawerWidth = 350;

function CollapseGroup(props: {
  primary?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const thisPrimary = props.primary ?? "";

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <React.Fragment>
      <ListItemButton onClick={handleClick}>
        <ListItemText primary={thisPrimary} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div">{props.children}</List>
      </Collapse>
    </React.Fragment>
  );
}

export interface DemoState {
  mobileOpen: boolean;
  alertOpen: boolean;
  alertText: string;
  cameraDeviceIdx: string;
  bgColor: ColorValue;
  blinkLinkLR: boolean;
  irisLockX: boolean;
  expression: "Neutral" | "Happy" | "Angry" | "Sad" | "Relaxed" | "Surprised";
  lockFinger: boolean;
  lockArm: boolean;
  lockLeg: boolean;
  resetInvisible: boolean;
  useCPU: boolean;
  trackingWindow: boolean;
  modelComplexity: 0 | 1 | 2;
  cameraOn: boolean;
  cameraList: MediaDeviceInfo[];
}

export class Demo extends Component<{ children?: React.ReactNode }, DemoState> {
  state: DemoState = {
    mobileOpen: false,
    alertOpen: false,
    alertText: "",
    cameraDeviceIdx: "",
    bgColor: createColor("#e7a2ff"),
    blinkLinkLR: true,
    irisLockX: true,
    expression: "Neutral",
    lockFinger: false,
    lockArm: false,
    lockLeg: false,
    resetInvisible: false,
    useCPU: false,
    trackingWindow: true,
    modelComplexity: 0,
    cameraOn: true,
    cameraList: [],
  };

  private readonly videoElement = React.createRef<HTMLVideoElement>();
  private readonly webglCanvas = React.createRef<HTMLCanvasElement>();
  private readonly videoCanvas = React.createRef<HTMLCanvasElement>();
  private readonly backdropDiv = React.createRef<HTMLDivElement>();
  private v3DWeb: V3DWeb | null = null;

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  componentDidMount() {
    try {
      console.log("this.videoElement.current: ", this.videoElement.current);
      console.log("this.webglCanvas.current: ", this.webglCanvas.current);
      console.log("this.videoCanvas.current: ", this.videoCanvas.current);
      const V3DWeb = await import("v3d-web/dist/src");
      this.v3DWeb = new V3DWeb(
        "testfiles/7198176664607455952.vrm",
        this.videoElement.current,
        this.webglCanvas.current,
        this.videoCanvas.current,
        null,
        {
          locateFile: (file) => {
            return `/holistic/${file}`;
          },
        },
        this.backdropDiv.current,
        () => {
          this.setState((prevState) => {
            let tempState = Object.assign({}, prevState) as DemoState;
            tempState.cameraList = this.v3DWeb!.cameraList;
            if (tempState.cameraList.length > 0)
              tempState.cameraDeviceIdx = "0";
            return tempState;
          });
        }
      );
    } catch (e: any) {
      this.showError(e);
    }
  }

  componentWillUnmount() {
    this.v3DWeb?.close();
    this.v3DWeb = null;
  }

  private showError(e: any) {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.alertOpen = true;
      tempState.alertText = e.toString();
      return tempState;
    });
  }

  private handleAlertState = (toggle: boolean) => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.alertOpen = toggle;
      return tempState;
    });
  };
  private handleDrawerToggle = () => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.mobileOpen = !tempState.mobileOpen;
      return tempState;
    });
  };
  private handleChange = (newValue: ColorValue) => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.bgColor = newValue;
      return tempState;
    });
    // Change actual background
    this.v3DWeb?.v3DCore?.setBackgroundColorHex(`#${(newValue as Color).hex}`);
  };
  private handleCameraChange = (event: SelectChangeEvent) => {
    const idx = parseInt(event.target.value);
    if (Number.isSafeInteger(idx)) {
      this.v3DWeb?.switchSource(idx);
      this.setState((prevState) => {
        let tempState = Object.assign({}, prevState) as DemoState;
        tempState.cameraDeviceIdx = event.target.value;
        return tempState;
      });
    }
  };
  private handleUploadModel = (e: React.FormEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!this.v3DWeb || !file) return;
    try {
      this.v3DWeb.vrmFile = file;
    } catch (e) {
      this.showError(e);
    }
  };
  /**
   * VRM Section
   */
  private handleBlinkLinking = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.blinkLinkLR = event.target.checked;

      if (this.v3DWeb) {
        const boneOptions = this.v3DWeb.boneOptions;
        boneOptions.blinkLinkLR = tempState.blinkLinkLR;
        this.v3DWeb.boneOptions = boneOptions;
      }
      return tempState;
    });
  };
  private handleGazeHorizontalLock = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.irisLockX = event.target.checked;

      if (this.v3DWeb) {
        const boneOptions = this.v3DWeb.boneOptions;
        boneOptions.irisLockX = tempState.irisLockX;
        this.v3DWeb.boneOptions = boneOptions;
      }
      return tempState;
    });
  };
  private handleLockFinger = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.lockFinger = event.target.checked;

      if (this.v3DWeb) {
        const boneOptions = this.v3DWeb.boneOptions;
        boneOptions.lockFinger = tempState.lockFinger;
        this.v3DWeb.boneOptions = boneOptions;
      }
      return tempState;
    });
  };
  private handleLockArm = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.lockArm = event.target.checked;

      if (this.v3DWeb) {
        const boneOptions = this.v3DWeb.boneOptions;
        boneOptions.lockArm = tempState.lockArm;
        this.v3DWeb.boneOptions = boneOptions;
      }
      return tempState;
    });
  };
  private handleLockLeg = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.lockLeg = event.target.checked;

      if (this.v3DWeb) {
        const boneOptions = this.v3DWeb.boneOptions;
        boneOptions.lockLeg = tempState.lockLeg;
        this.v3DWeb.boneOptions = boneOptions;
      }
      return tempState;
    });
  };
  private handleResetInvisible = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.resetInvisible = event.target.checked;

      if (this.v3DWeb) {
        const boneOptions = this.v3DWeb.boneOptions;
        boneOptions.resetInvisible = tempState.resetInvisible;
        this.v3DWeb.boneOptions = boneOptions;
      }
      return tempState;
    });
  };
  private handleExpression = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target.value as DemoState["expression"];
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.expression = target;

      if (this.v3DWeb) {
        const boneOptions = this.v3DWeb.boneOptions;
        boneOptions.expression = tempState.expression;
        this.v3DWeb.boneOptions = boneOptions;
      }
      return tempState;
    });
  };

  /**
   * MediaPipe Section
   */
  private handleModelComplexity = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const idx = parseInt(event.target.value);
    if (idx === 0 || idx === 1 || idx === 2) {
      this.setState((prevState) => {
        let tempState = Object.assign({}, prevState) as DemoState;
        tempState.modelComplexity = idx;

        if (this.v3DWeb) {
          const holisticOptions = this.v3DWeb.holisticOptions;
          holisticOptions.modelComplexity = tempState.modelComplexity;
          this.v3DWeb.holisticOptions = holisticOptions;
        }
        return tempState;
      });
    }
  };
  private handleTrackingWindowToggle = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.trackingWindow = event.target.checked;
      return tempState;
    });
  };
  private handleCameraOn = () => {
    this.setState((prevState) => {
      let tempState = Object.assign({}, prevState) as DemoState;
      tempState.cameraOn = !tempState.cameraOn;

      if (this.v3DWeb) {
        const holisticOptions = this.v3DWeb.holisticOptions;
        holisticOptions.cameraOn = tempState.cameraOn;
        this.v3DWeb.holisticOptions = holisticOptions;
      }
      return tempState;
    });
  };
  private handleReset = () => {
    if (this.v3DWeb) this.v3DWeb.reset();
  };

  render() {
    return (
      <div
        className={`bg-background grid h-screen w-screen gap-y-16 overflow-hidden`}
      >
        <div className="max-w-7xl max-h-4 mx-auto z-10">
          <Box sx={{ flexGrow: 1, display: "flex" }}>
            <Collapse in={this.state.alertOpen}>
              <Alert
                severity="error"
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                      this.handleAlertState(false);
                    }}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
                sx={{ mb: 2 }}
              >
                {this.state.alertText}
              </Alert>
            </Collapse>
            <div ref={this.backdropDiv}>
              <Backdrop open={true} sx={{ color: "#fff", zIndex: 20 }}>
                <CircularProgress color="inherit" />
              </Backdrop>
            </div>
            <Drawer
              variant="temporary"
              open={this.state.mobileOpen}
              BackdropProps={{ invisible: true }}
              onClose={this.handleDrawerToggle}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
              sx={{
                display: "block",
                "& .MuiDrawer-paper": {
                  boxSizing: "border-box",
                  width: drawerWidth,
                },
              }}
            >
              <div>
                <List>
                  <CollapseGroup primary={"Expression"}>
                    <FormControl sx={{ px: 2 }}>
                      <FormLabel
                        id="expression-radio-buttons-group-label"
                        focused={false}
                      >
                        Model Complexity
                      </FormLabel>
                      <RadioGroup
                        row
                        aria-labelledby="expression-radio-buttons-group-label"
                        defaultValue="Neutral"
                        name="expression-radio-buttons-group"
                        value={this.state.expression}
                        onChange={this.handleExpression}
                      >
                        <FormControlLabel
                          value="Neutral"
                          control={<Radio />}
                          label="Neutral"
                        />
                        <FormControlLabel
                          value="Happy"
                          control={<Radio />}
                          label="Happy"
                        />
                        <FormControlLabel
                          value="Angry"
                          control={<Radio />}
                          label="Angry"
                        />
                        <FormControlLabel
                          value="Sad"
                          control={<Radio />}
                          label="Sad"
                        />
                        <FormControlLabel
                          value="Relaxed"
                          control={<Radio />}
                          label="Relaxed"
                        />
                        <FormControlLabel
                          value="Surprised"
                          control={<Radio />}
                          label="Surprised"
                        />
                      </RadioGroup>
                    </FormControl>
                  </CollapseGroup>
                  <CollapseGroup primary={"Poses"}>
                    <FormControl sx={{ px: 2 }}>
                      <FormLabel id="iris-checkbox-group-label" focused={false}>
                        Gaze
                      </FormLabel>
                      <FormGroup row>
                        {/*<FormControlLabel control={*/}
                        {/*    <Checkbox checked={this.state.blinkLinkLR} onChange={this.handleBlinkLinking}/>} label="Link left and right blink" />*/}
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={this.state.irisLockX}
                              onChange={this.handleGazeHorizontalLock}
                            />
                          }
                          label="Lock gaze to horizontal"
                        />
                      </FormGroup>
                      <FormLabel
                        id="upper-checkbox-group-label"
                        focused={false}
                      >
                        Upper body
                      </FormLabel>
                      <FormGroup row>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={this.state.lockFinger}
                              onChange={this.handleLockFinger}
                            />
                          }
                          label="Lock fingers"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={this.state.lockArm}
                              onChange={this.handleLockArm}
                            />
                          }
                          label="Lock arms"
                        />
                      </FormGroup>
                      <FormLabel
                        id="lower-checkbox-group-label"
                        focused={false}
                      >
                        Lower body
                      </FormLabel>
                      <FormGroup row>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={this.state.lockLeg}
                              onChange={this.handleLockLeg}
                            />
                          }
                          label="Lock legs"
                        />
                      </FormGroup>
                      <FormLabel
                        id="other-checkbox-group-label"
                        focused={false}
                      >
                        Other
                      </FormLabel>
                      <FormGroup row>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={this.state.resetInvisible}
                              onChange={this.handleResetInvisible}
                            />
                          }
                          label="Reset poses when not visible"
                        />
                      </FormGroup>
                    </FormControl>
                  </CollapseGroup>
                  <CollapseGroup primary={"Background Color"}>
                    <Box sx={{ px: 2, mx: "auto" }}>
                      <ColorBox
                        disableAlpha
                        value={this.state.bgColor}
                        onChange={this.handleChange}
                      />
                    </Box>
                  </CollapseGroup>
                  <Divider />
                  <CollapseGroup primary={"Tracking"}>
                    <FormControl sx={{ px: 2 }}>
                      <FormLabel
                        id="model-radio-buttons-group-label"
                        focused={false}
                      >
                        Model Complexity
                      </FormLabel>
                      <RadioGroup
                        row
                        aria-labelledby="model-radio-buttons-group-label"
                        defaultValue="0"
                        name="model-radio-buttons-group"
                        value={this.state.modelComplexity}
                        onChange={this.handleModelComplexity}
                      >
                        <FormControlLabel
                          value="0"
                          control={<Radio />}
                          label="Light"
                        />
                        <FormControlLabel
                          value="1"
                          control={<Radio />}
                          label="Full"
                        />
                        <FormControlLabel
                          value="2"
                          control={<Radio />}
                          label="Heavy"
                        />
                      </RadioGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={this.state.trackingWindow}
                            onChange={this.handleTrackingWindowToggle}
                          />
                        }
                        label="Enable debugging window for tracking"
                      />
                    </FormControl>
                  </CollapseGroup>
                  <CollapseGroup primary={"Camera"}>
                    <FormControl sx={{ px: 2, minWidth: 180 }}>
                      <InputLabel
                        sx={{ px: 2 }}
                        id="camera-select-helper-label"
                      >
                        Camera
                      </InputLabel>
                      <Select
                        labelId="camera-select-helper-label"
                        id="camera-select-helper"
                        value={this.state.cameraDeviceIdx}
                        label="Camera"
                        onChange={this.handleCameraChange}
                      >
                        {this.state.cameraList.map((v, i) => {
                          return (
                            <MenuItem key={v.label} value={i}>
                              {v.label}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </CollapseGroup>
                  <CollapseGroup primary={"Switch model"}>
                    <Grid
                      container
                      spacing={0}
                      direction="row"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Grid
                        item
                        xs={6}
                        sx={{
                          px: 0,
                          textAlign: "center",
                        }}
                      >
                        <input
                          accept=".vrm,model/vrml,model/gltf+json,model/gltf-binary"
                          className="input"
                          style={{ display: "none" }}
                          id="file-upload"
                          type="file"
                          onChange={this.handleUploadModel}
                        />
                        <label htmlFor="file-upload">
                          <Button
                            variant="contained"
                            endIcon={<FileUploadIcon />}
                            component="span"
                          >
                            Upload model
                          </Button>
                        </label>
                      </Grid>
                    </Grid>
                  </CollapseGroup>
                  <ListItem key={"buttons"}>
                    <Grid
                      container
                      spacing={2}
                      direction="row"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Grid
                        item
                        xs={5}
                        sx={{
                          px: 0,
                          textAlign: "right",
                        }}
                      >
                        {/*<Button variant="contained" startIcon={<PlayArrowIcon />}>Start</Button>*/}
                        <Button
                          variant="contained"
                          startIcon={
                            this.state.cameraOn ? (
                              <StopIcon />
                            ) : (
                              <PlayArrowIcon />
                            )
                          }
                          color={this.state.cameraOn ? "error" : "info"}
                          onClick={this.handleCameraOn}
                        >
                          {this.state.cameraOn ? "Stop" : "Start"}
                        </Button>
                      </Grid>
                      <Grid
                        item
                        xs={5}
                        sx={{
                          px: 0,
                          textAlign: "left",
                        }}
                      >
                        <Button
                          variant="contained"
                          startIcon={<RefreshIcon />}
                          onClick={this.handleReset}
                        >
                          Reset
                        </Button>
                      </Grid>
                    </Grid>
                  </ListItem>
                </List>
              </div>
            </Drawer>
          </Box>
        </div>

        <div className="outer_container">
          <video className="input_video" ref={this.videoElement}></video>
          <div id="wrapper" className="canvas-container w-screen">
            <canvas
              id="webgl-canvas"
              className="output_canvas"
              ref={this.webglCanvas}
            ></canvas>
            <Box className="video_output_canvas">
              <canvas
                id="video-canvas"
                className="video_output_canvas"
                ref={this.videoCanvas}
                style={
                  this.state.trackingWindow
                    ? { display: "block" }
                    : { display: "none" }
                }
              ></canvas>
            </Box>
          </div>
        </div>

        <Box
          role="presentation"
          sx={{ position: "fixed", bottom: 32, right: 32 }}
          onClick={this.handleDrawerToggle}
        >
          <Fab color="primary" aria-label="settings">
            <SettingsIcon />
          </Fab>
        </Box>
      </div>
    );
  }
}

export default Demo;
