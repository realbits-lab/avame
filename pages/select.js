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

function SelectPage({ collectionUri }) {
  //* TODO: Get from json data.
  const imageUrl =
    "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/collection";
  const [attributes, setAttributes] = React.useState({});
  const [selectedTraitType, setSelectedTraitType] = React.useState("");
  const [selectedValue, setSelectedValue] = React.useState("");
  const [selectedData, setSelectedData] = React.useState();
  const [openDialog, setOpenDialog] = React.useState(false);

  //* Handle tab index.
  const [value, setValue] = React.useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const handleChangeIndex = (index) => {
    setValue(index);
  };

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
            // console.log(
            //   "testCollectionUriResult.data.attributes: ",
            //   testCollectionUriResult.data.attributes
            // );
            setAttributes(testCollectionUriResult.data.attributes);
          });
      }
      initialize();
    },
    [collectionUri]
  );

  function a11yProps(index) {
    return {
      id: `full-width-tab-${index}`,
      "aria-controls": `full-width-tabpanel-${index}`,
    };
  }

  function fetchSelectedData() {
    console.log("call fetchSelectedData()");
    console.log("selectedTraitType: ", selectedTraitType);
    console.log("selectedValue: ", selectedValue);

    axios
      .get("/api/get-register-data-list", {
        params: {
          type: selectedTraitType,
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

  const SelectDataList = ({ data }) => {
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
  };

  const TraitListTabPage = ({ data }) => {
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
              {Object.keys(attributes).map((traitType, idx) => {
                return <Tab label={traitType} {...a11yProps(idx)} key={idx} />;
              })}
            </Tabs>
          </AppBar>
          {Object.keys(attributes).map((traitType, idx) => {
            return (
              <TabPanel value={value} index={idx} key={idx}>
                {traitType}
              </TabPanel>
            );
          })}
        </Box>
      </>
    );
  };

  const TraitListPage = ({ data }) => {
    return (
      <>
        <Grid container>
          {Object.keys(attributes).map((traitType, idx) => {
            return (
              <Grid item key={idx}>
                <Button
                  onClick={() => {
                    setSelectedTraitType(traitType);
                    setOpenDialog(true);
                  }}
                >
                  {traitType}
                </Button>
              </Grid>
            );
          })}
        </Grid>
        <SelectDataList data={data} />
      </>
    );
  };

  const SelectContent = () => {
    return (
      <>
        <Grid container spacing={2}>
          {Object.entries(attributes).map(([traitType, values] = entry) => {
            console.log("traitType: ", traitType);
            console.log("values: ", values);
            if (traitType === selectedTraitType) {
              return values.map((value) => {
                console.log("value: ", value);
                return (
                  <Grid item key={`${traitType}/${value}`}>
                    <Button
                      size="small"
                      variant="contained"
                      key={`${traitType}/${value}`}
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
            image={`${imageUrl}/${selectedTraitType}/${selectedValue}.png`}
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
