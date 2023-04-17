import { PrismaClient } from "@prisma/client";

async function handler(req, res) {
  console.log("call /find-nft-with-metadata");

  //* Check method error.
  if (req.method !== "GET") {
    res.status(500).json({ error: "Unavailable method. Support only GET." });
    return;
  }

  //* Connect database.
  const prisma = new PrismaClient();
  await prisma.$connect();

  //* Check query.
  const traitType = req.query.traitType;
  const traitValue = req.query.traitValue;
  console.log("traitType: ", traitType);
  console.log("traitValue: ", traitValue);
  if (!traitType || !traitValue) {
    await prisma.$disconnect();
    return res.status(500).json({ error: "nok" });
  }

  try {
    let findManyResult;
    switch (type) {
      case "top":
        findManyResult = await prisma.avatar.findMany({
          where: {
            top: value,
          },
        });
        break;

      case "middle":
        findManyResult = await prisma.avatar.findMany({
          where: {
            middle: value,
          },
        });
        break;
    }
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
