import lodash from "lodash";
import level from "level";
import { client, subredditToModmail } from "./index.js";

const db = level("database", { createIfMissing: true });

checkDB("posts");
checkDB("deletedPosts");

async function addPosts(posts: rawRedditData[]) {
  let changes = false;
  let postsToWrite: rawRedditData[] = [];
  if (posts) {
    if (posts.length >= 1) {
      // get posts of database
      const dbPosts = await getPosts();

      // Oldest Post from reddit
      const min = Math.min(...posts.map((o) => o.created_utc));
      // Latest Post in Database
      const max = Number(Date.now().toFixed(0));

      // Push all posts in the database to the "postsToWrite" Array
      dbPosts.forEach((post: rawRedditData) => postsToWrite.push(post));

      // Push all new posts in the database to the "postsToWrite" Array and set changes to true to avoid unnecessary writes to disk
      posts.forEach(async (p: rawRedditData) => {
        if (!dbPosts.find((po: rawRedditData) => po.permalink == p.permalink)) {
          postsToWrite.push(p);
          changes = true;
        }
      });
      const deletedPosts: rawRedditData[] = [];

      // Here we check if there's a post in the database that is not in the reddit /new feed anymore
      // The oldest Post of the reddit feed will be the beginning of the database posts
      // The current Date is the end of the database posts
      // if there are any missing posts in the reddit post array, push them to the deletedPosts array
      dbPosts
        .filter((post) =>
          lodash.inRange(post.created_utc, min - 1, max + 1) ? post : null
        )
        .forEach((p) => {
          if (!posts.find((po) => po.permalink == p.permalink)) {
            deletedPosts.push(p);
          }
        });

      // only add deleted Posts if there are any
      if (deletedPosts.length != 0) {
        await addDeletedPosts(deletedPosts);
      }

      if (changes) {
        // changes made and needing to write to disk
        await db.put("posts", JSON.stringify(postsToWrite));
      }
    }
  }
}

async function getPosts(): Promise<rawRedditData[]> {
  let data = await db.get("posts");
  if (data) {
    return JSON.parse(data);
  } else {
    return [];
  }
}

async function addDeletedPosts(posts: rawRedditData[]) {
  const postsInDelDB: rawRedditData[] = JSON.parse(
    await db.get("deletedPosts")
  );

  let postArray: rawRedditData[] = [];
  let notNotified = posts.filter(
    (post) => !postsInDelDB.find((p) => post.permalink == p.permalink)
  );

  postsInDelDB.forEach((p) => postArray.push(p));

  notNotified.forEach((post) => {
    client
      .getSubmission(post.id)
      .fetch()
      .then(async (postFetched) => {
        if (postFetched.removed_by_category == "deleted") {
          postArray.push(JSON.parse(JSON.stringify(postFetched)));

          await db.put("deletedPosts", JSON.stringify(postArray));
          await sendNotification(post);
        }
      });
  });
}

async function sendNotification(post: rawRedditData) {
  client.createModmailDiscussion({
    srName: subredditToModmail,
    subject: `Submission by ${post.author} was deleted!`,
    body: `Link: https://reddit.com${post.permalink}\n\n\nTitle: ${post.title}\n\nContent: ${post.selftext}`,
  });
}

function checkDB(keyName: string) {
  db.get(keyName, async function (err, value) {
    if (value == '""' || value == "" || (err && err.name == "NotFoundError")) {
      await db.put(keyName, JSON.stringify([]));
      return;
    }
  });
}

export { addPosts, getPosts };

interface rawRedditData {
  subreddit: string;
  selftext: string;
  title: string;
  removed_by_category: string | null;
  banned_by: string | null;
  banned_at_utc: number | null;
  removed: boolean;
  removed_by: string | null;
  mod_reason_by: string | null;
  removal_reason: string | null;
  id: string;
  author: string;
  permalink: string;
  created_utc: number;
}
