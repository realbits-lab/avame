import React from "react";
import axios from "axios";
import { useContractRead } from "wagmi";
import { Network, Alchemy } from "alchemy-sdk";
import { useRecoilStateLoadable, useRecoilValueLoadable } from "recoil";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import Image from "mui-image";
import { styled } from "@mui/system";
import CardMedia from "@mui/material/CardMedia";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import { tooltipClasses } from "@mui/material/Tooltip";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
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
import CloseIcon from "@mui/icons-material/Close";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import { RBSnackbar, AlertSeverity } from "rent-market";
import AvatarView from "@/components/AvatarView";
import RentNft from "@/components/RentNft";
import {
  RBDialog,
  writeToastMessageState,
  readToastMessageState,
} from "@/components/RealBitsUtil";
import rentmarketABI from "@/contracts/rentMarket.json";

function AvatarSelect() {
  const FIND_NFT_WITH_METADATA_API_URL = "/api/find-nft-with-metadata";
  const RENT_MARKET_CONTRACT_ADDRES =
    process.env.NEXT_PUBLIC_RENT_MARKET_CONTRACT_ADDRESS;
  const alchemySettings = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
    //* TODO: Get from .env file.
    network: Network.MATIC_MUMBAI,
  };
  const alchemy = new Alchemy(alchemySettings);

  //* Get from json data.
  const collectionUrl =
    // "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/collection/collection.json";
    // "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/collection/base/base.vrm"
    "https://clothes-nft.s3.ap-northeast-2.amazonaws.com/collection/collection.json";
  const [avatarUrl, setAvatarUrl] = React.useState();
  const [attributes, setAttributes] = React.useState({});
  const selectedTraitRef = React.useRef();
  const [selectedValue, setSelectedValue] = React.useState();
  const [selectedData, setSelectedData] = React.useState();
  const [openDialog, setOpenDialog] = React.useState(true);
  const getImageDataUrl = React.useRef();
  const getMediaStreamFuncRef = React.useRef();
  const setAvatarPositionFuncRef = React.useRef();
  const getV3dCoreFuncRef = React.useRef();
  const traitMeshListRef = React.useRef({});
  const bodyMeshListRef = React.useRef([]);
  const bodyMaterialListRef = React.useRef([]);
  const [currentCollectionAddress, setCurrentCollectionAddress] =
    React.useState();
  const [collectionList, setCollectionList] = React.useState([]);
  const selectedTraitListRef = React.useRef({});
  const [rentNftList, setRentNftList] = React.useState([]);
  const [collectionMetadataList, setCollectionMetadataList] = React.useState(
    []
  );
  const [openRentDialog, setOpenRentDialog] = React.useState(false);

  //* Wagmi hook functions.
  //* Get all collection list.
  const {
    data: dataGetAllCollection,
    isError: isErrorGetAllCollection,
    isLoading: isLoadingGetAllCollection,
    isValidating: isValidatingGetAllCollection,
    status: statusGetAllCollection,
  } = useContractRead({
    address: RENT_MARKET_CONTRACT_ADDRES,
    abi: rentmarketABI.abi,
    functionName: "getAllCollection",
    cacheOnBlock: true,
    // watch: true,
    onSuccess(data) {
      console.log("call onSuccess()");
      console.log("data: ", data);

      setCollectionList([]);
      data.map((e) => {
        alchemy.nft.getNftsForContract(e.collectionAddress).then((result) => {
          setCollectionList({
            collectionAddress: e.collectionAddress,
            nfts: result.nfts,
          });
        });
      });
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

  //* Get all register data array.
  const {
    data: dataRegisterData,
    isError: isErrorRegisterData,
    isLoading: isLoadingRegisterData,
    isValidating: isValidatingRegisterData,
    status: statusRegisterData,
  } = useContractRead({
    address: RENT_MARKET_CONTRACT_ADDRES,
    abi: rentmarketABI.abi,
    functionName: "getAllRegisterData",
    // cacheOnBlock: true,
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

  React.useEffect(
    function () {
      // console.log("call useEffect()");
      // console.log("dataGetAllCollection: ", dataGetAllCollection);

      async function initialize() {
        // console.log("call initialize()");

        //* Set all collection metadata list.
        let dataList = [];
        const promises = dataGetAllCollection.map(async (element) => {
          let collectionMetadataResponse;
          try {
            console.log("element: ", element);
            console.log("element[uri]: ", element["uri"]);
            collectionMetadataResponse = await axios.get(element["uri"]);

            //* Check empty data.
            if (
              !collectionMetadataResponse ||
              !collectionMetadataResponse.data
            ) {
              console.error("Error: No collection list.");
              return;
            }
          } catch (error) {
            console.error(error);
          }

          return dataList.push(collectionMetadataResponse.data);
        });
        await Promise.all(promises);
        setCollectionMetadataList(dataList);

        //* Set collection list.
        if (dataList[0]) {
          console.log("dataList[0]: ", dataList[0]);
          setImageAndAttributes({ collectionMetadata: dataList[0] });
        }
      }

      if (dataGetAllCollection) {
        initialize();
      }
    },
    [dataGetAllCollection]
  );

  function setImageAndAttributes({ collectionMetadata }) {
    //* Get avatar base model url.
    setAvatarUrl(collectionMetadata.base_model.vrm_url);

    //* Set the first trait as the selected trait.
    Object.keys(collectionMetadata.attributes).map(function (trait, idx) {
      if (idx === 0) selectedTraitRef.current = trait;
    });

    //* Set attributes variable.
    setAttributes(collectionMetadata.attributes);

    //* Reset and initialize active step for the each trait mobile stepper as zero.
    activeStepListRef.current = [];
    Object.keys(collectionMetadata.attributes).map(function (trait) {
      activeStepListRef.current.push({ trait: trait, step: 0 });
    });
  }

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

  async function findNftWithMetadata() {
    console.log("call findNftWithMetadata()");
    // console.log("dataRegisterData: ", dataRegisterData);
    console.log("selectedTraitListRef.current: ", selectedTraitListRef.current);

    let result;
    try {
      result = await fetch(FIND_NFT_WITH_METADATA_API_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedTraitListRef.current),
      });
    } catch (error) {
      console.error(error);
    }
    // console.log("result: ", result);

    const resultJson = await result.json();
    // console.log("resultJson: ", resultJson);

    return resultJson.data;
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
    // console.log("call SelectTraitPage()");
    // console.log("inputTrait: ", inputTrait);
    // console.log("inputTraitList: ", inputTraitList);

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
            // console.log("traitValue: ", traitValue);
            // console.log("Math.floor(idx / 4): ", Math.floor(idx / 4));

            if (Math.floor(idx / 4) === activeStep) {
              return (
                <Grid item xs={3} key={idx}>
                  <CardMedia
                    component="img"
                    image={traitValue.image_url}
                    onClick={function () {
                      //* Add selected trait type and value.
                      selectedTraitListRef.current[inputTrait] =
                        traitValue.name;

                      const glbUrl = traitValue.glb_url;
                      const v3dCore = getV3dCoreFuncRef.current();

                      //* Import mesh from glb.
                      SceneLoader.ImportMesh(
                        null,
                        glbUrl,
                        "",
                        v3dCore.scene,
                        async function (meshes, particleSystems, skeletons) {
                          // console.log(
                          //   "v3dCore.scene.meshes: ",
                          //   v3dCore.scene.meshes
                          // );
                          // console.log("meshes: ", meshes);
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
                          let parentBone;
                          v3dCore.scene.skeletons.map((skeleton) => {
                            // console.log("skeleton: ", skeleton);

                            skeleton.bones.map((bone) => {
                              // console.log("bone.name: ", bone.name);
                              //* TODO: Use head bone for accessory and hips bone for clothes.
                              if (
                                inputTrait !== "body_top" &&
                                inputTrait !== "body_bottom" &&
                                bone.name === "J_Bip_C_Head"
                              ) {
                                parentBone = bone;
                              }

                              if (
                                (inputTrait === "body_top" ||
                                  inputTrait === "body_bottom") &&
                                bone.name === "J_Bip_C_Hips"
                              ) {
                                // console.log("bone: ", bone);
                                parentBone = bone;
                              }
                            });
                          });

                          meshes.map((mesh) => {
                            traitMeshListRef.current[inputTrait].push(mesh);

                            //* Calculate the difference between mesh absolute position and head bone absolute position.
                            const meshAbsolutePosition =
                              mesh.getAbsolutePosition();
                            const headBoneAbsolutePosition =
                              parentBone.getAbsolutePosition();
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

                            //* Set the position of mesh by difference between mesh and head bone.
                            // mesh.setAbsolutePosition(diffAbsolutePosition);

                            //* Set the parent of mesh to head bone in case of accessory.
                            // mesh.parent = parentBone;

                            // const result = BABYLON.Mesh.MergeMeshes([
                            //   ...v3dCore.scene.meshes,
                            //   mesh,
                            // ]);
                            // console.log("result: ", result);
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
                    key={idx + 1}
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
        <DialogTitle>
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
          <CollectionListPage />
          <TraitListTabPage />
        </DialogContent>
      </Dialog>
    );
  };

  function CollectionListPage() {
    return (
      <ImageList
        sx={{
          gridAutoFlow: "column",
          gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr)) !important",
          gridAutoColumns: "minmax(160px, 1fr)",
        }}
      >
        {collectionMetadataList.map((element, idx) => {
          // console.log("element: ", element);
          return (
            <ImageListItem
              key={idx}
              onClick={() => {
                console.log("element: ", element);
                setImageAndAttributes({ collectionMetadata: element });
                setCurrentCollectionAddress(element.address);
              }}
            >
              <Image src={element.image} alt={element.name} width={100} />
              <ImageListItemBar
                title={element.name}
                sx={{ width: "100px", height: "50px" }}
              />
            </ImageListItem>
          );
        })}
      </ImageList>
    );
  }

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
            useMotionUpdate={false}
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
        <Fab
          color="primary"
          onClick={() => {
            setOpenDialog(true);
          }}
          sx={{ m: 1 }}
        >
          <LightTooltip title="Select Cloth" placement="left">
            <CheckroomIcon color="secondary" />
          </LightTooltip>
        </Fab>
        <Fab
          color="primary"
          onClick={async () => {
            console.log("call onClick()");
            // const result = await findNftWithMetadata();
            // console.log("result: ", result);
            console.log(
              "selectedTraitListRef.current: ",
              selectedTraitListRef.current
            );

            //* Show rent dialog.
            setRentNftList(result);
            setOpenRentDialog(true);
          }}
          sx={{ m: 1 }}
        >
          <LightTooltip title="Rent Avatar" placement="left">
            <LocalGroceryStoreIcon color="secondary" />
          </LightTooltip>
        </Fab>
      </Box>

      <RBDialog
        inputOpenRBDialog={openRentDialog}
        inputSetOpenRBDialogFunc={setOpenRentDialog}
        inputTitle={"Rent Avatar"}
        transparent={true}
      >
        <Box
          sx={
            {
              // zIndex: 100,
              // position: "absolute",
              // top: 0,
              // right: 0,
              // m: 1,
              // p: 1,
            }
          }
          display="flex"
          flexDirection="column"
          justifyContent="flex-start"
          alignItems="flex-start"
        >
          {rentNftList.map((element, idx) => {
            // console.log("element: ", element);

            return (
              <RentNft
                key={idx}
                imageUrl={element.imageUrl}
                nftAddress={element.nftAddress}
                tokenId={element.tokenId}
              />
            );
            // return (
            //   <Card key={idx}>
            //     <CardMedia
            //       component="img"
            //       image={element.imageUrl}
            //       alt="Preview image"
            //     />
            //     <CardContent>
            //       <Typography variant="caption" color="text.secondary">
            //         {element.name}
            //       </Typography>
            //     </CardContent>
            //     <CardActions sx={{ justifyContent: "space-around" }}>
            //       <Button>Rent</Button>
            //     </CardActions>
            //   </Card>
            // );
          })}
        </Box>
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
    </>
  );
}

export default AvatarSelect;
