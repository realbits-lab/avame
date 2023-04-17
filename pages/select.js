import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import Tooltip from "@mui/material/Tooltip";
import { tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/system";
import HomeIcon from "@mui/icons-material/Home";
import AvatarSelect from "../components/AvatarSelect";

export default function Select() {
  const router = useRouter();
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

  return (
    <>
      <Box
        sx={{
          zIndex: 100,
          position: "absolute",
          top: 0,
          left: 0,
          m: 1,
          p: 1,
        }}
        display="flex"
        flexDirection="column"
        justifyContent="flex-end"
        alignItems="flex-end"
      >
        <Fab color="primary" onClick={() => {}} sx={{ m: 1 }}>
          <LightTooltip title="My Content" placement="left">
            <HomeIcon color="secondary" />
          </LightTooltip>
        </Fab>
      </Box>
      <AvatarSelect />
    </>
  );
}
