//* Show avatar nft attributes select page.
//* 1. Show trait type list in the top of page.
//* 2. After user click any trait type, show dialog which display the list of trait type.
//* 3. When user select any attribute, save that selection status.
//* 4. Set selection data with recoil.

import React from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";

function SelectPage({ collectionUri }) {
  const [traitArray, setTraitArray] = React.useState([]);
  const [attrArray, setAttrArray] = React.useState([]);
  const [attrDict, setAttrDict] = React.useState({});
  const [selectedTraitType, setSelectedTraitType] = React.useState("");
  const [openDialog, setOpenDialog] = React.useState(false);

  React.useEffect(
    function () {
      console.log("call useEffect()");

      async function initialize() {
        console.log("call initialize()");

        //* Get trait list from collection uri.
        let attrArrayResult = [];
        const testCollectionUri =
          "https://dulls-nft.s3.ap-northeast-2.amazonaws.com/collection.json";

        axios
          .get(testCollectionUri)
          .then(async function (testCollectionUriResult) {
            console.log("testCollectionUriResult: ", testCollectionUriResult);
            const entries = Object.entries(
              testCollectionUriResult.data.attributes
            );
            setAttrDict(testCollectionUriResult.data.attributes);
            console.log("entries: ", entries);
            // const key = entries[0];
            // const value = entries[1];

            // //* Set attributes.
            // await Promise.all(
            //   value.map((attr) => {
            //     attrArrayResult.push({
            //       trait_type: key,
            //       attributes: attr,
            //       isSelected: false,
            //     });
            //   })
            // );
            // console.log("attrArrayResult: ", attrArrayResult);
          });
      }
      initialize();
    },
    [collectionUri]
  );

  const TraitListPage = () => {
    return (
      <>
        <Grid container>
          {Object.keys(attrDict).map((traitType, idx) => {
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
      </>
    );
  };

  const SelectDialog = () => {
    return (
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Prompt</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {selectedTraitType || ""}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <>
      <TraitListPage />
      <SelectDialog />
    </>
  );
}

export default SelectPage;
