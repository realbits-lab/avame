// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

const jwt = require("jsonwebtoken");

type Data = {
  token?: any;
  error?: string;
  admin?: boolean;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log("call /api/chat/validate");

  const { authorization } = req.headers;
  console.log("authorization:", authorization);

  // * -------------------------------------------------------------------------
  // * Check authorization header.
  // * -------------------------------------------------------------------------
  if (
    authorization &&
    authorization.split &&
    authorization.split("Bearer").length < 2
  ) {
    // console.log("authorization error.");
    res.status(400).json({ error: "Authorization error." });
    return;
  }

  // * -------------------------------------------------------------------------
  // * Check authorization token.
  // * -------------------------------------------------------------------------
  try {
    const token = authorization?.split("Bearer")[1].trim();
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_CHAT_AUTH_TOKEN_SECRET);
    const { uuid, isAdmin } = decoded;
    const payload = {
      admin: isAdmin,
    };
    // console.log("decoded:", decoded);
    // console.log("uuid:", uuid, " isAdmin:", isAdmin);

    res.status(200).send(payload);
  } catch (error) {
    console.error(error);

    res.status(403).send({ error: "Token verification error." });
  }
}
