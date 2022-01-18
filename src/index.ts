import { addPosts } from "./db.js";
import { config } from "dotenv";
import Snoowrap from "snoowrap";

config();

import { subredditToQuery, subredditToModmail, userAgent } from "./config.js";

const client = new Snoowrap({
  userAgent,
  accessToken: process.env.accessToken,
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  refreshToken: process.env.refreshToken,
});

client.config({ continueAfterRatelimitError: true });

run();
setInterval(() => {
  run();
}, 30 * 1000);

function run() {
  client
    .getSubreddit(subredditToQuery)
    .getNew({ limit: 1000, show: "all" })
    .then(async (val) => {
      await addPosts(JSON.parse(JSON.stringify(val.toJSON())));
    });
}

export { client, subredditToModmail };
