import express from "express";
import bodyParser from "body-parser";
import { chromium } from "playwright";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/api/scraper/:username", async (req, res) => {
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext();

  const page = await context.newPage({
    bypassCSP: true,
  });

  const RESOURCE_EXCLUSTIONS = ["image", "font", "svg"];

  await page.route("**/*", (route) => {
    return RESOURCE_EXCLUSTIONS.includes(route.request().resourceType())
      ? route.abort()
      : route.continue();
  });

  await page.goto("https://www.instagram.com/accounts/login/");
  await page
    .locator('xpath=//input[contains(@name, "username")]')
    .fill(req.headers.user);
  await page
    .locator('xpath=//input[contains(@name, "password")]')
    .fill(req.headers.password);
  console.log("Logging in ...");
  await page.locator('xpath=//button[contains(@type, "submit")]').click();
  await page.waitForTimeout(5000);
  console.log("Visiting page ...");
  await page.goto("https://www.instagram.com/" + req.params.username);
  await page.waitForTimeout(5000);

  /**
   * Scroll page to load more post.
   */
  let currentPostCount = 0;
  let postCountTarget = parseInt(req.headers.target_post); // Comment count target
  console.log(req.headers.target_post);
  while (currentPostCount < postCountTarget) {
    await page.keyboard.press("End"); // Press 'End' key on keyboard to scroll to the end of the element.
    await page.waitForTimeout(3000); // Wait for the comments to load.
    // Recount count of comments
    currentPostCount = await page
      .locator('//div[contains(@class, "_aagu")]')
      .count();
    console.log(currentPostCount);
  }

  /**
   * To get loaded posts' URLs.
   * The loops went through each loaded post, get the a tag element, and takes the href attribute value.
   * Return array of loaded posts' URL.
   */
  const allPost = await page.$$eval("article", (posts) => {
    return posts.map((post) => {
      const urls = post.querySelectorAll("a");
      return Array.from(urls).map((url) => url.href);
    });
  });

  /**
   * Scraping function.
   */
  const postsURL = allPost[0];
  console.log(postsURL)
  async function scrape(postsURL) {
    let data = {
      postCount: postCountTarget,
      posts: [],
    };

    // Loop array of URLs
    for (let i = 0; i < postCountTarget; i++) {
      // Open new page and go to the url
      const url = postsURL[i];
      const page = await context.newPage();
      await page.goto(url);
      console.log("Visiting " + url + "...");

      // Locate a section where caption are located. Click the caption text to direct page focus to that section so we are able to scroll the comments.
      await page
        .locator(
          '//span[contains(@class, "x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs xt0psk2 x1i0vuye xvs91rp xo1l8bm x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj")]'
        )
        .click();

      //Scroll element to load more comments.
      let currentCommentsCount = 0;
      let commentCountTarget = parseInt(req.headers.target_comment);
      console.log(parseInt(req.headers.target_comment));
      while (currentCommentsCount < commentCountTarget) {
        await page.keyboard.press("End"); // Press 'End' key on keyboard to scroll to the end of the element.
        await page.waitForTimeout(3000); // Wait for the comments to load.
        currentCommentsCount = await page
          .locator('//span[contains(@class,"xjkvuk6")]')
          .count(); // Recount count of comments
        console.log(currentCommentsCount);
      }

      // Locate a section where caption and comments are located
      const innertexts = await page
        .locator(
          'xpath=//span[contains(@class, "x1lliihq x1plvlek xryxfnj x1n2onr6 x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x1i0vuye xvs91rp xo1l8bm x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj")]'
        )
        .allInnerTexts();

      const caption = page.locator(
        '//span[contains(@class, "xt0psk2 x1i0vuye xvs91rp xo1l8bm x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj")]'
      );

      /**
       * JSON of each post data containing post's URL, date posted, caption, likes, and list of comments.
       */
      let postData = {
        no: i+1,
        url: url,
        datePosted: await page
          .locator("xpath=//time")
          .first()
          .getAttribute("datetime"),
        caption: await caption.textContent(),
        likes: innertexts.slice(-1)[0],
        commentsCount: currentCommentsCount,
        comments: [],
      };

      /**
       * After the comments are loaded, loop through and assign the odd index as username and the even index as comment.
       * Push them into postData.comments.
       */
      const commentsArr = innertexts.slice(1, innertexts.length - 1); //Array of username and comments only.
      for (let j = 0, k = 0; j < commentsArr.length; j += 2) {
        postData.comments.push({
          no: (k += 1),
          username: commentsArr[j],
          comment: commentsArr[j + 1],
        });
      }
      // After the list of comments are completed, push the postData JSON to data.posts JSON.
      data.posts.push(postData);
    }
    return data;
  }

  const allPostData = await scrape(postsURL);
  console.log(JSON.stringify(allPostData));
  await page.close();
  // Your code to fetch users from a database or any other source
  // Send the response as JSON
  res.json(allPostData);
});
app.post("/api/users", (req, res) => {
  const newUser = req.body;
  // Your code to save the new user to the database or any other source
  // Send a response indicating success or failure
  res.json({ message: "User created successfully" });
});

const port = 3010;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
