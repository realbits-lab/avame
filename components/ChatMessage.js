import React from "react";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Box from "@mui/material/Box";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import { Z_INDEX } from "@/components/RealBitsUtil";

export default function ChatMessage() {
  return (
    <Box sx={{ zIndex: Z_INDEX.chatMessage, position: "absolute" }}>
      <Box position="fixed" bottom={0}>
        <Paper
          component="form"
          sx={{
            m: "20px",
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: "95vw",
          }}
        >
          <IconButton sx={{ p: "10px" }} aria-label="menu">
            <MenuIcon />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Write your message"
            inputProps={{ "aria-label": "search google maps" }}
          />
          <IconButton type="button" sx={{ p: "10px" }} aria-label="search">
            <SearchIcon />
          </IconButton>
          <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
          <IconButton
            color="primary"
            sx={{ p: "10px" }}
            aria-label="directions"
          >
            <SendIcon />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );
}
