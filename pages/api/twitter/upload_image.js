import nextConnect from "next-connect";
import { ethers } from "ethers";
import multer from "multer";

const IMAGE_UPLOAD_DIRECTORY = "./public/upload_image/";

//* Define image upload configuration.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, IMAGE_UPLOAD_DIRECTORY);
  },
  filename: function (req, file, cb) {
    // console.log("file: ", file);
    cb(null, Date.now() + ".jpg");
  },
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      return callback(new Error("Only png or jpeg(jpeg) format is allowed."));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024,
  },
});

const app = nextConnect({
  onError(error, req, res) {
    res
      .status(501)
      .json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

const upload = multer({ storage: storage });

app.use(function (req, res, next) {
  console.log("call nextConnect use()");
  upload.single("image_data");

  next();
});

app.post(upload.single("image_data"), function (req, res) {
  // console.log("call image_upload");
  // console.log("req.body.plain_message: ", req.body.plain_message);
  // console.log("req.body.sign_message: ", req.body.sign_message);

  const verified = ethers.utils.verifyMessage(
    req.body.plain_message,
    req.body.sign_message
  );
  // console.log("verified: ", verified);
  // console.log("req.body.signer_address: ", req.body.signer_address);

  //* TODO: Check isUserAllowed function from rent market contract for right.
  if (
    verified.localeCompare(req.body.signer_address, undefined, {
      sensitivity: "accent",
    }) === 0
  ) {
    res.status(200).json({ path: req.file.path });
  } else {
    res.status(404).json({ error: "Sign message is not valid." });
  }
});

export default app;

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};
