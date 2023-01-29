import nextConnect from "next-connect";
const fs = require("fs");
const path = require("path");

//*-----------------------------------------------------------------------------
//* Define server logic process.
//*-----------------------------------------------------------------------------
const IMAGE_UPLOAD_DIRECTORY = "./public/upload_image/";
const VIDEO_UPLOAD_DIRECTORY = "./public/upload_video/";
const KEEP_FILE_DURATION_DAY = 24 * 60 * 60 * 1000;

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

server.get(function (req, res) {
	//* TODO: Authenticate function caller.
  console.log("call /remove_upload");

  //* Get all files in upload_image directory and remove files.
  fs.readdir(IMAGE_UPLOAD_DIRECTORY, function (error, files) {
    if (error) throw error;
    remove_files({ files: files });
  });

  //* Get all files in upload_video directory and remove files.
  fs.readdir(VIDEO_UPLOAD_DIRECTORY, function (error, files) {
    if (error) throw error;
    remove_files({ files: files });
  });

  //* Check file name is over 1 day from now and remove it.
  res.status(200).json({ result: "ok" });
});

function remove_files({ files }) {
  if (!files) throw new Error("No files in directory.");

  const currentTimestampInMilliseconds = Date.now();
  // console.log(
  //   "currentTimestampInMilliseconds: ",
  //   currentTimestampInMilliseconds
  // );

  for (const file of files) {
    //* Check file name is over KEEP_FILE_DURATION_DAY day from now and remove it.
    // console.log("file: ", file);
    let fileTimestampInMilliseconds;
    try {
      fileTimestampInMilliseconds = parseInt(path.parse(file).name);
    } catch (error) {
      throw error;
    }
    // console.log("fileTimestampInMilliseconds: ", fileTimestampInMilliseconds);

    //* Add one day.
    fileTimestampInMilliseconds += KEEP_FILE_DURATION_DAY;
    // console.log(
    //   "diff: ",
    //   currentTimestampInMilliseconds - fileTimestampInMilliseconds
    // );

    if (currentTimestampInMilliseconds > fileTimestampInMilliseconds) {
      fs.unlink(path.join(IMAGE_UPLOAD_DIRECTORY, file), function (error) {
        if (error) throw error;
      });
    }
  }
}

export default server;

export const config = {
  api: {
    //* Disallow body parsing, consume as stream
    bodyParser: false,
  },
};
