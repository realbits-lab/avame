import { PrismaClient } from "@prisma/client";

async function handler(req, res) {
  console.log("call /find-nft-with-metadata");

  //* Check method error.
  if (req.method !== "POST") {
    res.status(500).json({ error: "Unavailable method. Support only POST." });
    return;
  }

  //* Connect database.
  const prisma = new PrismaClient();
  await prisma.$connect();

  //* Check query.
  console.log("req.body: ", req.body);
  // const traitList = req.query.traitList;
  const traitList = req.body;
  console.log("traitList: ", traitList);

  //* Check query error.
  if (!traitList) {
    await prisma.$disconnect();
    return res.status(500).json({ error: "nok" });
  }

  try {
    let findManyResult;
    findManyResult = await prisma.avatar.findMany({
      where: traitList,
    });
    console.log("findManyResult: ", findManyResult);

    if (findManyResult === null) {
      await prisma.$disconnect();
      return res.status(500).json({ error: "nok" });
    }

    //* Send 200 OK response.
    await prisma.$disconnect();
    return res.status(200).json({
      data: findManyResult,
    });
  } catch (error) {
    console.error(error);
    await prisma.$disconnect();
    return res.status(500).json({ error: "nok" });
  }
}

export default handler;
