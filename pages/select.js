//* Show avatar nft attributes select page.
//* 1. Show trait type list in the top of page.
//* 2. After user click any trait type, show dialog which display the list of trait type.
//* 3. When user select any attribute, save that selection status.
//* 4. Set selection data with recoil.

import React from "react";
import axios from "axios";
import * as BABYLON from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { styled } from "@mui/system";
import { tooltipClasses } from "@mui/material/Tooltip";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
import CardMedia from "@mui/material/CardMedia";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Fab from "@mui/material/Fab";
import MobileStepper from "@mui/material/MobileStepper";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import AvatarView from "../components/AvatarView";

function SelectPage({ collectionUri }) {
  //* TODO: Get from json data.
  const baseUrl =
    "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/collection";
  const [attributes, setAttributes] = React.useState({});
  const selectedTraitRef = React.useRef();
  const [selectedValue, setSelectedValue] = React.useState();
  const [selectedData, setSelectedData] = React.useState();
  const [openDialog, setOpenDialog] = React.useState(true);
  const [avatarUrl, setAvatarUrl] = React.useState(
    "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/collection/base/base.vrm"
  );
  const getImageDataUrl = React.useRef();
  const getMediaStreamFuncRef = React.useRef();
  const setAvatarPositionFuncRef = React.useRef();
  const getV3dCoreFuncRef = React.useRef();
  const traitMeshListRef = React.useRef({});
  const bodyMeshListRef = React.useRef([]);
  const bodyMaterialListRef = React.useRef([]);

  //* Handle tab index.
  const [value, setValue] = React.useState(0);
  function handleChange(event, newValue) {
    setValue(newValue);
  }
  function handleChangeIndex(index) {
    setValue(index);
  }

  //* Handle trait stepper.
  const [activeStep, setActiveStep] = React.useState(0);
  const activeStepListRef = React.useRef([]);
  function handleNext() {
    setActiveStep(function (prevActiveStep) {
      // console.log("selectedTraitRef.current: ", selectedTraitRef.current);
      let step;
      activeStepListRef.current.map(function (e) {
        if (e.trait === selectedTraitRef.current) {
          e.step = e.step + 1;
          step = e.step;
        }
      });
      // console.log("step: ", step);
      return step;
    });
  }
  function handleBack() {
    setActiveStep(function (prevActiveStep) {
      // console.log("selectedTraitRef.current: ", selectedTraitRef.current);
      let step;
      activeStepListRef.current.map(function (e) {
        if (e.trait === selectedTraitRef.current) {
          e.step = e.step - 1;
          if (e.step < 0) e.step = 0;
          step = e.step;
        }
      });
      // console.log("step: ", step);
      return step;
    });
  }

  React.useEffect(
    function () {
      // console.log("call useEffect()");

      async function initialize() {
        // console.log("call initialize()");

        //* Get trait list from collection uri.
        let attrArrayResult = [];
        const testCollectionUri =
          "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/collection/collection.json";

        const testCollectionUriResult = await axios.get(testCollectionUri);
        // console.log(
        //   "testCollectionUriResult.data.attributes: ",
        //   testCollectionUriResult.data.attributes
        // );

        //* Set the first trait as the selected trait.
        Object.keys(testCollectionUriResult.data.attributes).map(function (
          trait,
          idx
        ) {
          if (idx === 0) selectedTraitRef.current = trait;
        });

        //* Set attributes variable.
        setAttributes(testCollectionUriResult.data.attributes);

        //* Reset and initialize active step for the each trait mobile stepper as zero.
        activeStepListRef.current = [];
        Object.keys(testCollectionUriResult.data.attributes).map(function (
          trait
        ) {
          activeStepListRef.current.push({ trait: trait, step: 0 });
        });
      }
      initialize();
    },
    [collectionUri]
  );

  function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`full-width-tabpanel-${index}`}
        aria-labelledby={`full-width-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

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

  function a11yProps(index) {
    return {
      id: `full-width-tab-${index}`,
      "aria-controls": `full-width-tabpanel-${index}`,
    };
  }

  function fetchSelectedData() {
    // console.log("call fetchSelectedData()");
    // console.log("selectedTraitRef.current: ", selectedTraitRef.current);
    // console.log("selectedValue: ", selectedValue);

    axios
      .get("/api/get-register-data-list", {
        params: {
          type: selectedTraitRef.current,
          value: selectedValue,
        },
      })
      .then((result) => {
        // console.log("result: ", result);
        // console.log("result.data.data: ", result.data.data);
        setSelectedData(result.data.data);
      })
      .catch((error) => console.error(error));
  }

  function SelectDataList({ data }) {
    // console.log("call SelectDataList()");
    // console.log("data: ", data);

    if (!data) {
      return <></>;
    }

    return (
      <>
        {data.map((data, idx) => {
          return <Typography key={idx}>{data.name}</Typography>;
        })}
      </>
    );
  }

  function SelectTraitPage({ inputTrait, inputTraitList }) {
    console.log("call SelectTraitPage()");
    console.log("inputTrait: ", inputTrait);
    console.log("inputTraitList: ", inputTraitList);

    //* Check data is empty.
    if (
      Array.isArray(inputTraitList) === false ||
      inputTraitList.length === 0
    ) {
      return <Typography>No trait list data</Typography>;
    }

    const maxActiveStep = Math.ceil(inputTraitList.length / 4);

    return (
      <>
        <Grid container>
          {inputTraitList.map(function (traitValue, idx) {
            // console.log("inputTrait: ", inputTrait);
            // console.log("Math.floor(idx / 4): ", Math.floor(idx / 4));

            if (Math.floor(idx / 4) === activeStep) {
              return (
                <Grid item xs={3} key={idx}>
                  <CardMedia
                    component="img"
                    image={traitValue.image_url}
                    onClick={function () {
                      const glbUrl = traitValue.glb_url;
                      const v3dCore = getV3dCoreFuncRef.current();

                      SceneLoader.ImportMesh(
                        inputTrait,
                        glbUrl,
                        "",
                        v3dCore.scene,
                        async function (meshes, particleSystems, skeletons) {
                          // console.log("skeletons: ", skeletons);
                          //* If there're already pre-added meshes, remove them all.
                          if (traitMeshListRef.current[inputTrait]) {
                            traitMeshListRef.current[inputTrait].map((mesh) => {
                              mesh.dispose();
                              mesh = null;
                            });
                          }

                          //* Initialize  mesh list.
                          traitMeshListRef.current[inputTrait] = [];

                          //* Find the head bone.
                          let headBone;
                          v3dCore.scene.skeletons.map((skeleton) => {
                            // console.log("skeleton: ", skeleton);
                            skeleton.bones.map((bone) => {
                              if (bone.name === "J_Bip_C_Head") {
                                // console.log("bone: ", bone);
                                headBone = bone;
                              }
                            });
                          });

                          meshes.map((mesh) => {
                            traitMeshListRef.current[inputTrait].push(mesh);

                            //* Calculate the difference between mesh absolute position and head bone absolute position.
                            const meshAbsolutePosition =
                              mesh.getAbsolutePosition();
                            const headBoneAbsolutePosition =
                              headBone.getAbsolutePosition();
                            const diffAbsolutePosition =
                              meshAbsolutePosition.subtract(
                                headBoneAbsolutePosition
                              );
                            // console.log(
                            //   "meshAbsolutePosition: ",
                            //   meshAbsolutePosition
                            // );
                            // console.log(
                            //   "headBoneAbsolutePosition: ",
                            //   headBoneAbsolutePosition
                            // );
                            // console.log(
                            //   "diffAbsolutePosition: ",
                            //   diffAbsolutePosition
                            // );

                            mesh.setAbsolutePosition(diffAbsolutePosition);
                            mesh.parent = headBone;
                          });
                        }
                      );
                    }}
                    sx={{ width: "80%", height: "80%" }}
                  />
                </Grid>
              );
            }
          })}
        </Grid>

        <MobileStepper
          variant="dots"
          steps={maxActiveStep}
          position="static"
          activeStep={activeStep}
          sx={{ flexGrow: 1 }}
          nextButton={
            <Button
              size="small"
              onClick={handleNext}
              disabled={activeStep === maxActiveStep - 1}
            >
              Next
              <KeyboardArrowRight />
            </Button>
          }
          backButton={
            <Button
              size="small"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              <KeyboardArrowLeft />
              Back
            </Button>
          }
        />
      </>
    );
  }

  function TraitListTabPage() {
    return (
      <>
        <Box
          sx={{ bgcolor: "background.paper", width: "100%", height: "100%" }}
        >
          <AppBar position="static">
            <Tabs
              value={value}
              onChange={handleChange}
              indicatorColor="secondary"
              textColor="inherit"
              variant="fullWidth"
              aria-label="full width tabs example"
            >
              {Object.keys(attributes).map((trait, idx) => {
                return (
                  <Tab
                    label={trait}
                    {...a11yProps(idx)}
                    key={idx}
                    onClick={() => {
                      selectedTraitRef.current = trait;
                      activeStepListRef.current.map(function (e) {
                        // console.log("trait: ", trait);
                        // console.log("data: ", data);
                        if (e.trait === trait) {
                          setActiveStep(e.step);
                        }
                      });
                    }}
                  />
                );
              })}
            </Tabs>
          </AppBar>
          {Object.entries(attributes).map(([trait, traitList], idx) => {
            return (
              <TabPanel value={value} index={idx} key={idx}>
                <SelectTraitPage
                  inputTrait={trait}
                  inputTraitList={traitList}
                />
              </TabPanel>
            );
          })}
        </Box>
      </>
    );
  }

  function TraitListPage({ data }) {
    return (
      <>
        <Grid container>
          {Object.keys(attributes).map((trait, idx) => {
            return (
              <Grid item key={idx}>
                <Button
                  onClick={() => {
                    selectedTraitRef.current = trait;
                    setOpenDialog(true);
                  }}
                >
                  {trait}
                </Button>
              </Grid>
            );
          })}
        </Grid>
        <SelectDataList data={data} />
      </>
    );
  }

  const SelectContent = () => {
    return (
      <>
        <Grid container spacing={2}>
          {Object.entries(attributes).map(([trait, values] = entry) => {
            // console.log("trait: ", trait);
            // console.log("values: ", values);
            if (trait === selectedTraitRef.current) {
              return values.map((value) => {
                // console.log("value: ", value);
                return (
                  <Grid item key={`${trait}/${value}`}>
                    <Button
                      size="small"
                      variant="contained"
                      key={`${trait}/${value}`}
                      sx={{ m: "2px" }}
                      onClick={() => {
                        setSelectedValue(value);
                      }}
                    >
                      {value}
                    </Button>
                  </Grid>
                );
              });
            }
          })}
        </Grid>
        <Box sx={{ width: "90vw", height: "90vh" }}>
          <CardMedia
            component="img"
            image={`${baseUrl}/${selectedTraitRef.current}/${selectedValue}.png`}
          />
        </Box>
      </>
    );
  };

  const SelectDialog = () => {
    return (
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
        }}
        PaperProps={{
          style: {
            backgroundColor: "transparent",
          },
          sx: {
            position: "fixed",
            bottom: 10,
            left: 10,
            width: "90vw",
            height: "50vh",
          },
        }}
      >
        <DialogTitle id="alert-dialog-title">
          <Typography color={(theme) => theme.palette.grey[800]}>
            Select clothes and accessories.
          </Typography>
          <IconButton
            aria-label="close"
            onClick={function () {
              setOpenDialog(false);
            }}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TraitListTabPage />
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <Grid
        container
        display="flex"
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="flex-start"
      >
        <Grid item>
          <AvatarView
            inputGltfDataUrl={avatarUrl}
            getV3dCoreFuncRef={getV3dCoreFuncRef}
            getImageDataUrlFunc={getImageDataUrl}
            // VideoChat -> AvatarView call for new Remon.
            // TakeVideo -> AvatarView call for recording video.
            getMediaStreamFunc={getMediaStreamFuncRef}
            // VideoChat -> AvatarView call for changing avatar canvas position.
            // ScreenView -> AvatarView call for changing avatar canvas position.
            setAvatarPositionFunc={setAvatarPositionFuncRef}
          />
        </Grid>
        <Grid item>
          <SelectDialog />
        </Grid>
      </Grid>

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
            setOpenDialog(true);
          }}
          sx={{ m: 1 }}
        >
          <LightTooltip title="My Content" placement="left">
            <PersonIcon color="secondary" />
          </LightTooltip>
        </Fab>
      </Box>
    </>
  );
}

export default SelectPage;
