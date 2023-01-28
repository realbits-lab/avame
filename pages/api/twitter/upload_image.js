import nextConnect from "next-connect";
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

app.post(upload.array("file"), function (req, res) {
  // res.json(req.files.map((v) => v.filename));
	res.send(`${IMAGE_UPLOAD_DIRECTORY}${path.parse(req.file.path).base}`);
});

export default app;

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};
