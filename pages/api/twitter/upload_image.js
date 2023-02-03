import fs from "fs";
import nextConnect from "next-connect";
import { ethers } from "ethers";
import multer from "multer";

//*-----------------------------------------------------------------------------
//* Define image upload process.
//*-----------------------------------------------------------------------------
const IMAGE_UPLOAD_DIRECTORY = "./public/upload_image/";
const diskStorageOptions = multer.diskStorage({
  //* Set destination directory of upload.
  destination: function (req, file, cb) {
    fs.mkdirSync(IMAGE_UPLOAD_DIRECTORY, { recursive: true });
    cb(null, IMAGE_UPLOAD_DIRECTORY);
  },

  //* Set uploaded file name.
  filename: function (req, file, cb) {
    // console.log("file: ", file);
    cb(null, Date.now() + ".jpg");
  },

  //* Set uploaded file filter as image file.
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      return callback(new Error("Only png or jpeg(jpeg) format is allowed."));
    }
    callback(null, true);
  },

  //* Set the maximum size of uploaded file as 1 MB.
  limits: {
    fileSize: 1024 * 1024,
  },
});

const multerUpload = multer({ storage: diskStorageOptions });

//*-----------------------------------------------------------------------------
//* Define server logic process.
//*-----------------------------------------------------------------------------
const server = nextConnect({
  onError(error, req, res) {
    res
      .status(501)
      .json({ error: `Sorry, error happened. message: ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

server.post(multerUpload.single("image_data"), function (req, res) {
  // console.log("call /upload_image");
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

export default server;

export const config = {
  api: {
    //* Disallow body parsing, consume as stream
    bodyParser: false,
  },
};
