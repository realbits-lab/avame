// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

type Data = {
  token: any;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log("call /api/chat/validate");

  //* TODO: Check this is user is ok to isOwnerOrRenter in rent-market contract.
  const isAdmin = req?.query?.admin === "true";
  const payload = {
    uuid: uuidv4(),
    isAdmin,
  };

  //*---------------------------------------------------------------------------
  //* Make a token with jwt sign function.
  //*---------------------------------------------------------------------------
  const token = jwt.sign(
    payload,
    process.env.NEXT_PUBLIC_CHAT_AUTH_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );

  //*---------------------------------------------------------------------------
  //* Send a token.
  //*---------------------------------------------------------------------------
  res.send({ token });
}
