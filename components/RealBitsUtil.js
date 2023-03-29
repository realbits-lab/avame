import React from "react";
import Link from "@mui/material/Link";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import CloseIcon from "@mui/icons-material/Close";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { atom, selector } from "recoil";
import { v4 as uuidv4, v1 } from "uuid";

export const MyMenu = {
  own: "own",
  rent: "rent",
};

export const RBSize = {
  small: 24,
  middle: 40,
  big: 56,
  double: 112,
  triple: 168,
};

export const AlertSeverity = {
  error: "error",
  warning: "warning",
  info: "info",
  success: "success",
};

export function getUniqueKey() {
  // return Math.random().toString(16).slice(2);
  return uuidv4();
}

export function shortenAddress({ address, number = 4, withLink = "" }) {
  // console.log("address: ", address);
  // console.log("withLink: ", withLink);

  const POLYGON_MATICMUM_SCAN_URL = "https://mumbai.polygonscan.com/address/";
  const POLYGON_MATIC_SCAN_URL = "https://polygonscan.com/address/";
  const OPENSEA_MATIC_URL = "https://opensea.io/assets?search[query]=";
  const OPENSEA_MATICMUM_URL =
    "https://testnets.opensea.io/assets?search[query]=";
  let stringLength = 0;
  let middleString = "";

  let openseaUrl;
  let polygonScanUrl;
  if (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK === "matic") {
    openseaUrl = OPENSEA_MATIC_URL;
    polygonScanUrl = `${POLYGON_MATIC_SCAN_URL}${address}`;
  } else if (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK === "maticmum") {
    openseaUrl = OPENSEA_MATICMUM_URL;
    polygonScanUrl = `${POLYGON_MATICMUM_SCAN_URL}${address}`;
  } else {
    openseaUrl = "";
    polygonScanUrl = "";
  }

  // Check number maximum.
  if (number > 19 || number < 1) {
    stringLength = 20;
    middleString = "";
  } else {
    stringLength = number;
    middleString = "...";
  }

  if (
    (typeof address === "string" || address instanceof String) &&
    address.length > 0
  ) {
    switch (withLink) {
      case "maticscan":
      case "scan":
        return (
          <Link href={polygonScanUrl} target="_blank">
            {`${address.substring(
              0,
              number + 2
            )}${middleString}${address.substring(address.length - number)}`}
          </Link>
        );

      case "opensea_matic":
      case "opensea_maticmum":
      case "opensea":
        return (
          <Link href={`${openseaUrl}${address}`} target="_blank">
            {`${address.substring(
              0,
              number + 2
            )}${middleString}${address.substring(address.length - number)}`}
          </Link>
        );

      default:
        return `${address.substring(
          0,
          number + 2
        )}${middleString}${address.substring(address.length - number)}`;
    }
  } else {
    return "";
  }
}

// * Change ipfs url to gateway url.
export function changeIPFSToGateway(ipfsUrl) {
  if (
    typeof ipfsUrl === "string" &&
    ipfsUrl.length > 6 &&
    ipfsUrl.substring(0, 7) === "ipfs://"
  ) {
    const cidUrl = ipfsUrl.substring(7, ipfsUrl.length);
    // const gatewayUrl = "https://gateway.pinata.cloud/ipfs/" + cidUrl;
    const gatewayUrl = "https://nftstorage.link/ipfs/" + cidUrl;
    // console.log("gatewayUrl: ", gatewayUrl);

    return gatewayUrl;
  } else {
    return ipfsUrl;
  }
}

// https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
export function isInt(value) {
  const x = parseFloat(value);
  return !isNaN(value) && (x | 0) === x;
}

export function getChainName({ chainId }) {
  // console.log("-- chainId: ", chainId);

  // https://github.com/DefiLlama/chainlist/blob/main/constants/chainIds.js
  const chainIds = {
    0: "kardia",
    1: "ethereum",
    5: "goerli",
    6: "kotti",
    8: "ubiq",
    10: "optimism",
    19: "songbird",
    20: "elastos",
    25: "cronos",
    30: "rsk",
    40: "telos",
    50: "xdc",
    52: "csc",
    55: "zyx",
    56: "binance",
    57: "syscoin",
    60: "gochain",
    61: "ethereumclassic",
    66: "okexchain",
    70: "hoo",
    82: "meter",
    87: "nova network",
    88: "tomochain",
    100: "xdai",
    106: "velas",
    108: "thundercore",
    122: "fuse",
    128: "heco",
    137: "matic",
    200: "xdaiarb",
    246: "energyweb",
    250: "fantom",
    269: "hpb",
    288: "boba",
    321: "kucoin",
    336: "shiden",
    361: "theta",
    416: "sx",
    534: "candle",
    592: "astar",
    820: "callisto",
    888: "wanchain",
    1088: "metis",
    1231: "ultron",
    1284: "moonbeam",
    1285: "moonriver",
    1337: "localhost",
    2000: "dogechain",
    2020: "ronin",
    2222: "kava",
    4689: "iotex",
    5050: "xlc",
    5551: "nahmii",
    6969: "tombchain",
    8217: "klaytn",
    9001: "evmos",
    10000: "smartbch",
    31337: "localhost",
    32659: "fusion",
    42161: "arbitrum",
    42170: "arb-nova",
    42220: "celo",
    42262: "oasis",
    43114: "avalanche",
    47805: "rei",
    55555: "reichain",
    71402: "godwoken",
    80001: "maticmum",
    333999: "polis",
    888888: "vision",
    1313161554: "aurora",
    1666600000: "harmony",
    11297108109: "palm",
    836542336838601: "curio",
  };

  if (typeof chainId === "string" || chainId instanceof String) {
    if (chainId.startsWith("0x") === true) {
      return chainIds[Number(chainId)];
    } else {
      return chainId;
    }
  } else if (isInt(chainId) === true) {
    return chainIds[chainId];
  }
}

export const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function BootstrapDialogTitle(props) {
  const { children, onClose, ...other } = props;
  // console.log("onClose: ", onClose);

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={function () {
            // console.log("call onClick()");

            onClose();
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
      ) : null}
    </DialogTitle>
  );
}

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
  inputTitle,
  children,
  transparent,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  // console.log("call RBDialog");
  // console.log("inputOpenRBDialog: ", inputOpenRBDialog);
  // console.log("inputTitle: ", inputTitle);
  const [openRBDialog, setOpenRBDialog] = React.useState(false);
  const [title, setTitle] = React.useState(0);

  React.useEffect(() => {
    // console.log("call React.useEffect()");
    // console.log("inputOpenRBDialog: ", inputOpenRBDialog);
    // console.log("inputSetOpenRBDialogFunc: ", inputSetOpenRBDialogFunc);
    // console.log("inputTitle: ", inputTitle);

    setOpenRBDialog(inputOpenRBDialog);
    setTitle(inputTitle);
  }, [
    inputOpenRBDialog,
    inputSetOpenRBDialogFunc,
    transitionComponent,
    keepMounted,
    inputTitle,
    children,
    transparent,
  ]);

  return (
    <Dialog
      open={openRBDialog}
      onClose={() => {
        try {
          inputSetOpenRBDialogFunc(false);
        } catch (error) {
          throw error;
        }
      }}
      TransitionComponent={transitionComponent}
      keepMounted={keepMounted}
      scroll="paper"
      fullScreen={fullScreen}
      PaperProps={{
        style: {
          backgroundColor: transparent ? "transparent" : "white",
        },
        sx: {
          m: 0,
          // width: "100vw",
        },
      }}
    >
      <>
        <BootstrapDialogTitle
          onClose={function () {
            // console.log("call onClose()");

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
        <DialogContent dividers={false}>{children}</DialogContent>
      </>
    </Dialog>
  );
};

export const writeToastMessageState = atom({
  key: `writeToastMessageState/${v1()}`,
  snackbarSeverity: AlertSeverity.info,
  snackbarMessage: "",
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

export const getErrorDescription = ({ errorString }) => {
  const errorCode = {
    RM1: "The same element is already request.",
    RM2: "The same element is already register.",
    RM3: "No element in register.",
    RM4: "Sender is not the owner of NFT.",
    RM5: "Sender is not the owner of NFT or the owner of rentMarket.",
    RM6: "No register for this service address.",
    RM7: "No register eata for this NFT.",
    RM8: "Transaction value is not same as the rent fee.",
    RM9: "Already rented.",
    RM10: "No rent data in renteeDataMap for this NFT.",
    RM11: "msg.sender should be same as renteeAddress.",
    RM12: "Sum should be 100.",
    RM13: "msg.sender should be zero, because of erc20 payment.",
    RM14: "Failed to recipient.call.",
    RM15: "msg.sender should be same as renteeAddress or the owner of rentMarket.",
    RM16: "The current block number is under rent start + rent duraiont block.",
    RM17: "Sender is not the recipient or the owner of rentMarket.",
    RM18: "IERC20 approve function call failed.",
    RM19: "IERC20 transferFrom function call failed.",
    RM20: "Fee token address is not registered.",
  };

  return errorCode[errorString];
};
