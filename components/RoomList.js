import React from "react";
import { Grid, Card, CardContent, Button, Typography } from "@mui/material";

const RoomList = ({ roomList, connectCallFunc, onClose }) => {
  return (
    <>
      {/*--------------------------------------------------------------------*/}
      {/* Show registered NFT list. */}
      {/*--------------------------------------------------------------------*/}
      <Grid container spacing={2}>
        {roomList.map((element) => {
          console.log("element: ", element);
          let callButtonTitle = "";

          switch (element.status) {
            case "WAIT":
              callButtonTitle = "Call";
              break;

            case "COMPLETED":
              callButtonTitle = "Talk";
              break;

            default:
              callButtonTitle = "N/A";
              break;
          }

          return (
            <Grid item key={element.id}>
              <Card sx={{ maxWidth: 345 }}>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {element.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {element.id}
                  </Typography>
                  <Button
                    variant="contained"
                    className="callButton"
                    onClick={async () => {
                      await connectCallFunc(element.id);
                      onClose();
                    }}
                    disabled={element.status !== "WAIT" ? true : false}
                  >
                    {callButtonTitle}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
};

export default RoomList;
