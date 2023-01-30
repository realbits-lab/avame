import { withIronSessionApiRoute } from "iron-session/next";
import { TwitterApi } from "twitter-api-v2";

const sessionOptions = {
  password: process.env.NEXT_PUBLIC_COOKIE_PASSWORD,
  cookieName: "avame",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};
function buildErrorPage() {
  return `<html> \
    <head> \
    <link rel="stylesheet" type="text/css" rel="noopener" target="_blank" href="/style.css"> \
    </head> \
    <body> \
      <div class="container"> \
        <div class="child"> \
          Message can't be uploaded for any reason.<p/> \
          <br/><br/> \
          <a href="${process.env.NEXT_PUBLIC_AVAME_URL}" class="button-52">Go to avame site</a><p/> \
        </div> \
      </div> \
    </body> \
    </html>`;
}

async function handler(req, res) {
  //*-------------------------------------------------------------------------
  //* Extract tokens from query string
  //*-------------------------------------------------------------------------
  const { oauth_token, oauth_verifier } = req.query;
  // console.log("oauth_token: ", oauth_token);
  // console.log("oauth_verifier: ", oauth_verifier);

  //*-------------------------------------------------------------------------
  //* Get the saved oauth_token_secret from session
  //*-------------------------------------------------------------------------
  const { oauth_token_secret, twitterText } = req.session;
  // console.log("twitterText: ", twitterText);
  // console.log("oauth_token_secret: ", oauth_token_secret);

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    //* Handle denied error.
    res.status(200).send(buildErrorPage());
  }

  //*-------------------------------------------------------------------------
  //* Obtain the persistent tokens.
  //* Create a client from temporary tokens.
  //*-------------------------------------------------------------------------
  const client = new TwitterApi({
    appKey: process.env.NEXT_PUBLIC_TWITTER_CONSUMER_KEY,
    appSecret: process.env.NEXT_PUBLIC_TWITTER_CONSUMER_SECRET,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  });

  //*-------------------------------------------------------------------------
  //* Login twitter.
  //*-------------------------------------------------------------------------
  const {
    client: loggedClient,
    accessToken,
    accessSecret,
  } = await client.login(oauth_verifier);

  //*-------------------------------------------------------------------------
  //* Upload media to twitter.
  //*-------------------------------------------------------------------------
  let tweetResponse;
  try {
    // console.log("req.session.path: ", req.session.path);
    // First, post all your images to Twitter
    // TODO: Should check the mp4 conversion finished.
    const mediaIds = await Promise.all([
      loggedClient.v1.uploadMedia(req.session.path),
    ]);
    // console.log("mediaIds: ", mediaIds);

    // mediaIds is a string[], can be given to .tweet
    tweetResponse = await loggedClient.v1.tweet(twitterText, {
      media_ids: mediaIds,
    });
    // console.log("tweetResponse: ", tweetResponse);
  } catch (error) {
    console.error(error);
    res.status(403).json({ error: "Invalid verifier or access tokens." });
    return;
  }

  //*-------------------------------------------------------------------------
  //* Get tweet url.
  //*-------------------------------------------------------------------------
  let tweetUrl;
  try {
    const startIndex = tweetResponse.display_text_range[1];
    const endIndex = tweetResponse.full_text.length;
    tweetUrl = tweetResponse.full_text.substring(startIndex, endIndex);
    // console.log("tweetUrl: ", tweetUrl);
  } catch (error) {
    console.error(error);
    res.status(403).json({ error: "Invalid verifier or access tokens." });
    return;
  }

  // * -----------------------------------------------------------------------
  // * Send response html page.
  // * -----------------------------------------------------------------------
  res.status(200).send(buildResponsePage({ tweetUrl }));
}

function buildResponsePage({ tweetUrl }) {
  return `<html> \
    <head> \
    <link rel="stylesheet" type="text/css" rel="noopener" target="_blank" href="/style.css"> \
    </head> \
    <body> \
      <div class="container"> \
        <div class="child"> \
          Tweet is uploaded.<p/> \
          <br/><br/> \
          <a href="${tweetUrl}" class="button-52">Go to tweet post</a><p/> \
          <br/><br/> \
          <a href="${process.env.NEXT_PUBLIC_AVAME_URL}" class="button-52">Go to avame site</a><p/> \
        </div> \
      </div> \
    </body> \
    </html>`;
}

export default withIronSessionApiRoute(handler, sessionOptions);
