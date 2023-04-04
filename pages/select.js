//* Show avatar nft attributes select page.
//* 1. Show trait type list in the top of page.
//* 2. After user click any trait type, show dialog which display the list of trait type.
//* 3. When user select any attribute, save that selection status.
//* 4. Set selection data with recoil.

import React from "react";
import axios from "axios";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import MobileStepper from "@mui/material/MobileStepper";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

function SelectPage({ collectionUri }) {
  //* TODO: Get from json data.
  const imageUrl =
    "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/collection";
  const [attributes, setAttributes] = React.useState({});
  const selectedTraitRef = React.useRef();
  const [selectedValue, setSelectedValue] = React.useState();
  const [selectedData, setSelectedData] = React.useState();
  const [openDialog, setOpenDialog] = React.useState(false);

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
          "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/collection.json";

        axios
          .get(testCollectionUri)
          .then(async function (testCollectionUriResult) {
            console.log(
              "testCollectionUriResult.data.attributes: ",
              testCollectionUriResult.data.attributes
            );

            Object.keys(testCollectionUriResult.data.attributes).map(function (
              trait,
              idx
            ) {
              if (idx === 0) selectedTraitRef.current = trait;
            });

            setAttributes(testCollectionUriResult.data.attributes);
            activeStepListRef.current = [];
            Object.keys(testCollectionUriResult.data.attributes).map(function (
              trait
            ) {
              activeStepListRef.current.push({ trait: trait, step: 0 });
            });
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
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }

  function a11yProps(index) {
    return {
      id: `full-width-tab-${index}`,
      "aria-controls": `full-width-tabpanel-${index}`,
    };
  }

  function fetchSelectedData() {
    console.log("call fetchSelectedData()");
    console.log("selectedTraitRef.current: ", selectedTraitRef.current);
    console.log("selectedValue: ", selectedValue);

    axios
      .get("/api/get-register-data-list", {
        params: {
          type: selectedTraitRef.current,
          value: selectedValue,
        },
      })
      .then((result) => {
        console.log("result: ", result);
        console.log("result.data.data: ", result.data.data);
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

  function SelectTraitPage({ trait, traitList }) {
    //* Check data is empty.
    if (Array.isArray(traitList) === false || traitList.length === 0) {
      return <Typography>No trait list data</Typography>;
    }

    const maxActiveStep = Math.ceil(traitList.length / 4);

    return (
      <>
        <Grid container>
          {Object.entries(attributes).map(function ([key, value]) {
            if (key === trait) {
              return value.map(function (traitValue, idx) {
                // console.log(
                //   "trait image url: ",
                //   `${imageUrl}/${trait}/${traitValue}.png`
                // );
                // console.log("trait: ", trait);
                // console.log("Math.floor(idx / 4): ", Math.floor(idx / 4));

                if (Math.floor(idx / 4) === activeStep) {
                  return (
                    <Grid item xs={6} key={idx}>
                      <Card>
                        <CardMedia
                          component="img"
                          image={`${imageUrl}/${trait}/${traitValue}.png`}
                        />
                      </Card>
                    </Grid>
                  );
                }
              });
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

  function TraitListTabPage({ data }) {
    return (
      <>
        <Box sx={{ bgcolor: "background.paper", width: "100vw" }}>
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
                      activeStepListRef.current.map(function (data) {
                        console.log("trait: ", trait);
                        console.log("data: ", data);
                        if (data.trait === trait) {
                          setActiveStep(data.step);
                        }
                      });
                    }}
                  />
                );
              })}
            </Tabs>
          </AppBar>
          {Object.entries(attributes).map(([trait, traitList], idx) => {
            // console.log("trait: ", trait);
            // console.log("traitList: ", traitList);

            return (
              <TabPanel value={value} index={idx} key={idx}>
                <SelectTraitPage trait={trait} traitList={traitList} />
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
            console.log("trait: ", trait);
            console.log("values: ", values);
            if (trait === selectedTraitRef.current) {
              return values.map((value) => {
                console.log("value: ", value);
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
            image={`${imageUrl}/${selectedTraitRef.current}/${selectedValue}.png`}
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
          fetchSelectedData();
          setOpenDialog(false);
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">SELECT</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <SelectContent />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              fetchSelectedData();
              setOpenDialog(false);
            }}
            autoFocus
          >
            Close
          </Button>
        </DialogActions>
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
          <Card>
            <CardMedia
              component="img"
              image="https://picsum.photos/200"
              sx={{ objectFit: "contain", width: "100vw", height: "50vh" }}
            />
          </Card>
        </Grid>
        <Grid item>
          <TraitListTabPage data={selectedData} />
          <SelectDialog />
        </Grid>
      </Grid>
    </>
  );
}

export default SelectPage;
