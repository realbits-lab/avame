// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { withIronSessionApiRoute } from "iron-session/next";
import { TwitterApi } from "twitter-api-v2";

const sessionOptions = {
  password: process.env.NEXT_PUBLIC_COOKIE_PASSWORD,
  cookieName: "avame",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

async function handler(req, res) {
  //*---------------------------------------------------------------------------
  //* Set for OAuth1.0a.
  //*---------------------------------------------------------------------------
  const twitterApiClient = new TwitterApi({
    appKey: process.env.NEXT_PUBLIC_TWITTER_CONSUMER_KEY,
    appSecret: process.env.NEXT_PUBLIC_TWITTER_CONSUMER_SECRET,
  });

  //*---------------------------------------------------------------------------
  //* Get twitter auth link.
  //*---------------------------------------------------------------------------
  const twitterAuthLink = await twitterApiClient.generateAuthLink(
    process.env.NEXT_PUBLIC_TWITTER_CALLBACK_URL,
    {
      linkMode: "authorize",
    }
  );
  // console.log("twitterAuthLink: ", twitterAuthLink);

  //*---------------------------------------------------------------------------
  //* Save oauth_token and oauth_token_secret in req.session.
  //*---------------------------------------------------------------------------
  req.session.oauth_token = twitterAuthLink.oauth_token;
  req.session.oauth_token_secret = twitterAuthLink.oauth_token_secret;

  //*---------------------------------------------------------------------------
  //* Save path and twitter text in req.session.
  //*---------------------------------------------------------------------------
  // console.log("req.query.path: ", req.query.path);
  // console.log("req.query.twitterText: ", req.query.twitterText);
  req.session.path = req.query.path;
  req.session.twitterText = req.query.twitterText;

  //*---------------------------------------------------------------------------
  //* Save at a session.
  //*---------------------------------------------------------------------------
  await req.session.save();

  //*---------------------------------------------------------------------------
  //* Send a twitter auth link url for twitter OAuth1.0a authentication.
  //*---------------------------------------------------------------------------
  res.status(200).json({ url: twitterAuthLink.url });
}

export default withIronSessionApiRoute(handler, sessionOptions);
