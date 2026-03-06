/**
 * Infer metadata (title, description) from URL patterns
 * without fetching the page. Useful as immediate fallback
 * before OG metadata loads.
 */

type InferredMeta = {
  title: string;
  description?: string;
};

type PatternRule = {
  match: (url: URL) => boolean;
  infer: (url: URL) => InferredMeta;
};

function humanize(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Known hostnames → static titles */
const staticSites: Record<string, InferredMeta> = {
  "news.ycombinator.com": { title: "Hacker News" },
  "mail.google.com": { title: "Gmail", description: "Google Mail" },
  "calendar.google.com": { title: "Google Calendar" },
  "drive.google.com": { title: "Google Drive" },
  "docs.google.com": { title: "Google Docs" },
  "sheets.google.com": { title: "Google Sheets" },
  "slides.google.com": { title: "Google Slides" },
  "meet.google.com": { title: "Google Meet" },
  "maps.google.com": { title: "Google Maps" },
  "photos.google.com": { title: "Google Photos" },
  "translate.google.com": { title: "Google Translate" },
  "chat.openai.com": { title: "ChatGPT" },
  "chatgpt.com": { title: "ChatGPT" },
  "claude.ai": { title: "Claude" },
  "vercel.com": { title: "Vercel" },
  "netlify.com": { title: "Netlify" },
  "stackoverflow.com": { title: "Stack Overflow" },
  "www.stackoverflow.com": { title: "Stack Overflow" },
  "codepen.io": { title: "CodePen" },
  "codesandbox.io": { title: "CodeSandbox" },
  "replit.com": { title: "Replit" },
  "discord.com": { title: "Discord" },
  "discord.gg": { title: "Discord Invite" },
  "slack.com": { title: "Slack" },
  "trello.com": { title: "Trello" },
  "www.trello.com": { title: "Trello" },
  "airtable.com": { title: "Airtable" },
  "miro.com": { title: "Miro" },
  "canva.com": { title: "Canva" },
  "www.canva.com": { title: "Canva" },
  "dribbble.com": { title: "Dribbble" },
  "www.dribbble.com": { title: "Dribbble" },
  "behance.net": { title: "Behance" },
  "www.behance.net": { title: "Behance" },
  "producthunt.com": { title: "Product Hunt" },
  "www.producthunt.com": { title: "Product Hunt" },
  "dev.to": { title: "DEV Community" },
  "hashnode.com": { title: "Hashnode" },
  "huggingface.co": { title: "Hugging Face" },
  "kaggle.com": { title: "Kaggle" },
  "www.kaggle.com": { title: "Kaggle" },
  "twitch.tv": { title: "Twitch" },
  "www.twitch.tv": { title: "Twitch" },
  "open.spotify.com": { title: "Spotify" },
  "soundcloud.com": { title: "SoundCloud" },
  "www.soundcloud.com": { title: "SoundCloud" },
  "pinterest.com": { title: "Pinterest" },
  "www.pinterest.com": { title: "Pinterest" },
  "instagram.com": { title: "Instagram" },
  "www.instagram.com": { title: "Instagram" },
  "tiktok.com": { title: "TikTok" },
  "www.tiktok.com": { title: "TikTok" },
  "whatsapp.com": { title: "WhatsApp" },
  "web.whatsapp.com": { title: "WhatsApp Web" },
  "telegram.org": { title: "Telegram" },
  "t.me": { title: "Telegram" },
  "dropbox.com": { title: "Dropbox" },
  "www.dropbox.com": { title: "Dropbox" },
  "box.com": { title: "Box" },
  "www.box.com": { title: "Box" },
  "1password.com": { title: "1Password" },
  "bitwarden.com": { title: "Bitwarden" },
  "jira.atlassian.com": { title: "Jira" },
  "confluence.atlassian.com": { title: "Confluence" },
  "bitbucket.org": { title: "Bitbucket" },
  "gitlab.com": { title: "GitLab" },
  "heroku.com": { title: "Heroku" },
  "render.com": { title: "Render" },
  "railway.app": { title: "Railway" },
  "supabase.com": { title: "Supabase" },
  "firebase.google.com": { title: "Firebase" },
  "console.firebase.google.com": { title: "Firebase Console" },
  "aws.amazon.com": { title: "AWS" },
  "console.aws.amazon.com": { title: "AWS Console" },
  "portal.azure.com": { title: "Azure Portal" },
  "cloud.google.com": { title: "Google Cloud" },
  "console.cloud.google.com": { title: "Google Cloud Console" },
  "stripe.com": { title: "Stripe" },
  "dashboard.stripe.com": { title: "Stripe Dashboard" },
  "paypal.com": { title: "PayPal" },
  "www.paypal.com": { title: "PayPal" },
  "shopify.com": { title: "Shopify" },
  "www.shopify.com": { title: "Shopify" },
  "etsy.com": { title: "Etsy" },
  "www.etsy.com": { title: "Etsy" },
  "ebay.com": { title: "eBay" },
  "www.ebay.com": { title: "eBay" },
  "amazon.com": { title: "Amazon" },
  "www.amazon.com": { title: "Amazon" },
  "wolframalpha.com": { title: "Wolfram Alpha" },
  "www.wolframalpha.com": { title: "Wolfram Alpha" },
  "excalidraw.com": { title: "Excalidraw" },
  "linear.app": { title: "Linear" },
  "app.linear.app": { title: "Linear" },
  "asana.com": { title: "Asana" },
  "app.asana.com": { title: "Asana" },
  "monday.com": { title: "Monday.com" },
  "clickup.com": { title: "ClickUp" },
  "app.clickup.com": { title: "ClickUp" },
  "loom.com": { title: "Loom" },
  "www.loom.com": { title: "Loom" },
  "zoom.us": { title: "Zoom" },
};

const patterns: PatternRule[] = [
  // Static sites (exact hostname match)
  {
    match: (url) => url.hostname in staticSites,
    infer: (url) => staticSites[url.hostname],
  },

  // GitHub: /user/repo
  {
    match: (url) => url.hostname === "github.com" && url.pathname.split("/").filter(Boolean).length >= 2,
    infer: (url) => {
      const [owner, repo, ...rest] = url.pathname.split("/").filter(Boolean);
      if (rest.length === 0) {
        return { title: `${owner}/${repo}`, description: `GitHub repository` };
      }
      if (rest[0] === "issues" && rest[1]) {
        return { title: `${owner}/${repo} #${rest[1]}`, description: "GitHub issue" };
      }
      if (rest[0] === "pull" && rest[1]) {
        return { title: `${owner}/${repo} PR #${rest[1]}`, description: "GitHub pull request" };
      }
      if (rest[0] === "discussions" && rest[1]) {
        return { title: `${owner}/${repo} Discussion #${rest[1]}`, description: "GitHub discussion" };
      }
      if (rest[0] === "releases") {
        return { title: `${owner}/${repo} Releases`, description: "GitHub releases" };
      }
      if (rest[0] === "actions") {
        return { title: `${owner}/${repo} Actions`, description: "GitHub Actions" };
      }
      if (rest[0] === "wiki") {
        const page = rest[1] ? humanize(rest[1]) : "Wiki";
        return { title: `${owner}/${repo} — ${page}`, description: "GitHub wiki" };
      }
      if (rest[0] === "tree" || rest[0] === "blob") {
        const path = rest.slice(2).join("/");
        return { title: `${owner}/${repo} — ${path || rest[1]}`, description: "GitHub file" };
      }
      return { title: `${owner}/${repo}`, description: `GitHub — ${humanize(rest[0])}` };
    },
  },
  // GitHub: user profile
  {
    match: (url) => url.hostname === "github.com" && url.pathname.split("/").filter(Boolean).length === 1,
    infer: (url) => {
      const user = url.pathname.split("/").filter(Boolean)[0];
      return { title: user, description: "GitHub profile" };
    },
  },
  // GitHub Gist
  {
    match: (url) => url.hostname === "gist.github.com",
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      return { title: `Gist by ${parts[0] || "unknown"}`, description: "GitHub Gist" };
    },
  },

  // YouTube: video
  {
    match: (url) =>
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      url.pathname === "/watch",
    infer: () => ({ title: "YouTube Video", description: "YouTube" }),
  },
  // YouTube: short link
  {
    match: (url) => url.hostname === "youtu.be",
    infer: () => ({ title: "YouTube Video", description: "YouTube" }),
  },
  // YouTube: channel
  {
    match: (url) =>
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      (url.pathname.startsWith("/@") || url.pathname.startsWith("/c/")),
    infer: (url) => {
      const name = url.pathname.split("/").filter(Boolean)[0].replace("@", "");
      return { title: humanize(name), description: "YouTube channel" };
    },
  },
  // YouTube: playlist
  {
    match: (url) =>
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      url.pathname === "/playlist",
    infer: () => ({ title: "YouTube Playlist", description: "YouTube" }),
  },

  // Twitter/X: post
  {
    match: (url) =>
      (url.hostname === "twitter.com" || url.hostname === "x.com") &&
      url.pathname.includes("/status/"),
    infer: (url) => {
      const user = url.pathname.split("/").filter(Boolean)[0];
      return { title: `@${user} on X`, description: "Post on X" };
    },
  },
  // Twitter/X: profile
  {
    match: (url) =>
      (url.hostname === "twitter.com" || url.hostname === "x.com") &&
      url.pathname.split("/").filter(Boolean).length === 1,
    infer: (url) => {
      const user = url.pathname.split("/").filter(Boolean)[0];
      return { title: `@${user}`, description: "X profile" };
    },
  },

  // Reddit: post
  {
    match: (url) =>
      (url.hostname === "www.reddit.com" || url.hostname === "reddit.com") &&
      url.pathname.includes("/comments/"),
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      const subIdx = parts.indexOf("r");
      const sub = subIdx >= 0 ? parts[subIdx + 1] : "reddit";
      const commentsIdx = parts.indexOf("comments");
      const slug = commentsIdx >= 0 && parts[commentsIdx + 2] ? parts[commentsIdx + 2] : undefined;
      const postTitle = slug ? humanize(slug) : "Post";
      return { title: postTitle, description: `r/${sub}` };
    },
  },
  // Reddit: subreddit
  {
    match: (url) =>
      (url.hostname === "www.reddit.com" || url.hostname === "reddit.com") &&
      url.pathname.startsWith("/r/"),
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      return { title: `r/${parts[1]}`, description: "Reddit community" };
    },
  },
  // Reddit: user
  {
    match: (url) =>
      (url.hostname === "www.reddit.com" || url.hostname === "reddit.com") &&
      url.pathname.startsWith("/u/"),
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      return { title: `u/${parts[1]}`, description: "Reddit user" };
    },
  },

  // npm package
  {
    match: (url) =>
      url.hostname === "www.npmjs.com" &&
      url.pathname.startsWith("/package/"),
    infer: (url) => {
      const pkg = url.pathname.replace("/package/", "");
      return { title: pkg, description: "npm package" };
    },
  },

  // PyPI package
  {
    match: (url) =>
      url.hostname === "pypi.org" &&
      url.pathname.startsWith("/project/"),
    infer: (url) => {
      const pkg = url.pathname.split("/").filter(Boolean)[1];
      return { title: pkg, description: "PyPI package" };
    },
  },

  // crates.io (Rust)
  {
    match: (url) =>
      url.hostname === "crates.io" &&
      url.pathname.startsWith("/crates/"),
    infer: (url) => {
      const pkg = url.pathname.split("/").filter(Boolean)[1];
      return { title: pkg, description: "Rust crate" };
    },
  },

  // Wikipedia
  {
    match: (url) => url.hostname.endsWith(".wikipedia.org") && url.pathname.startsWith("/wiki/"),
    infer: (url) => {
      const article = decodeURIComponent(url.pathname.replace("/wiki/", "")).replace(/_/g, " ");
      return { title: article, description: "Wikipedia" };
    },
  },

  // LinkedIn profile
  {
    match: (url) =>
      url.hostname === "www.linkedin.com" &&
      url.pathname.startsWith("/in/"),
    infer: (url) => {
      const name = url.pathname.split("/").filter(Boolean)[1];
      return { title: humanize(name), description: "LinkedIn profile" };
    },
  },
  // LinkedIn company
  {
    match: (url) =>
      url.hostname === "www.linkedin.com" &&
      url.pathname.startsWith("/company/"),
    infer: (url) => {
      const name = url.pathname.split("/").filter(Boolean)[1];
      return { title: humanize(name), description: "LinkedIn company" };
    },
  },

  // Figma
  {
    match: (url) => url.hostname === "www.figma.com" && (url.pathname.startsWith("/file/") || url.pathname.startsWith("/design/")),
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      const name = parts[2] ? humanize(parts[2]) : "Figma file";
      return { title: name, description: "Figma" };
    },
  },

  // Notion
  {
    match: (url) => url.hostname.endsWith("notion.so") || url.hostname.endsWith("notion.site"),
    infer: (url) => {
      const last = url.pathname.split("/").filter(Boolean).pop();
      if (last) {
        const name = last.replace(/-[a-f0-9]{32}$/, "");
        return { title: humanize(name), description: "Notion" };
      }
      return { title: "Notion", description: "Notion page" };
    },
  },

  // Medium article
  {
    match: (url) =>
      url.hostname === "medium.com" ||
      url.hostname.endsWith(".medium.com"),
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      const slug = parts[parts.length - 1];
      if (slug) {
        const name = slug.replace(/-[a-f0-9]{10,}$/, "");
        return { title: humanize(name), description: "Medium" };
      }
      return { title: "Medium", description: "Medium article" };
    },
  },

  // Substack
  {
    match: (url) => url.hostname.endsWith(".substack.com"),
    infer: (url) => {
      const pub = url.hostname.replace(".substack.com", "");
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "p" && parts[1]) {
        return { title: humanize(parts[1]), description: `${humanize(pub)} on Substack` };
      }
      return { title: humanize(pub), description: "Substack" };
    },
  },

  // Stack Overflow question
  {
    match: (url) =>
      (url.hostname === "stackoverflow.com" || url.hostname === "www.stackoverflow.com") &&
      url.pathname.startsWith("/questions/"),
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      const slug = parts[2];
      return { title: slug ? humanize(slug) : "Stack Overflow Question", description: "Stack Overflow" };
    },
  },

  // Spotify track/album/playlist
  {
    match: (url) => url.hostname === "open.spotify.com" && url.pathname.split("/").filter(Boolean).length >= 2,
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      const type = parts[0];
      return { title: `Spotify ${humanize(type)}`, description: "Spotify" };
    },
  },

  // Twitch channel
  {
    match: (url) =>
      (url.hostname === "twitch.tv" || url.hostname === "www.twitch.tv") &&
      url.pathname.split("/").filter(Boolean).length === 1,
    infer: (url) => {
      const channel = url.pathname.split("/").filter(Boolean)[0];
      return { title: channel, description: "Twitch channel" };
    },
  },

  // Instagram profile
  {
    match: (url) =>
      (url.hostname === "instagram.com" || url.hostname === "www.instagram.com") &&
      url.pathname.split("/").filter(Boolean).length === 1,
    infer: (url) => {
      const user = url.pathname.split("/").filter(Boolean)[0];
      return { title: `@${user}`, description: "Instagram" };
    },
  },

  // TikTok profile
  {
    match: (url) =>
      (url.hostname === "tiktok.com" || url.hostname === "www.tiktok.com") &&
      url.pathname.startsWith("/@"),
    infer: (url) => {
      const user = url.pathname.split("/").filter(Boolean)[0].replace("@", "");
      return { title: `@${user}`, description: "TikTok" };
    },
  },

  // Google search
  {
    match: (url) =>
      (url.hostname === "www.google.com" || url.hostname === "google.com") &&
      url.pathname === "/search",
    infer: (url) => {
      const q = url.searchParams.get("q");
      return { title: q ? `"${q}" — Google Search` : "Google Search", description: "Google" };
    },
  },

  // Amazon product
  {
    match: (url) =>
      url.hostname.includes("amazon.") &&
      url.pathname.includes("/dp/"),
    infer: (url) => {
      const parts = url.pathname.split("/");
      const dpIdx = parts.indexOf("dp");
      const slug = parts.slice(1, dpIdx).filter(Boolean).pop();
      return { title: slug ? humanize(slug) : "Amazon Product", description: "Amazon" };
    },
  },

  // Vercel project
  {
    match: (url) => url.hostname === "vercel.com" && url.pathname.split("/").filter(Boolean).length >= 1,
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      return { title: humanize(parts[parts.length - 1]), description: "Vercel" };
    },
  },

  // GitLab project
  {
    match: (url) => url.hostname === "gitlab.com" && url.pathname.split("/").filter(Boolean).length >= 2,
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      return { title: `${parts[0]}/${parts[1]}`, description: "GitLab repository" };
    },
  },

  // Bitbucket repo
  {
    match: (url) => url.hostname === "bitbucket.org" && url.pathname.split("/").filter(Boolean).length >= 2,
    infer: (url) => {
      const parts = url.pathname.split("/").filter(Boolean);
      return { title: `${parts[0]}/${parts[1]}`, description: "Bitbucket repository" };
    },
  },

  // Loom video
  {
    match: (url) =>
      (url.hostname === "www.loom.com" || url.hostname === "loom.com") &&
      url.pathname.startsWith("/share/"),
    infer: () => ({ title: "Loom Video", description: "Loom" }),
  },

  // Google Docs/Sheets/Slides with path
  {
    match: (url) =>
      url.hostname === "docs.google.com" &&
      (url.pathname.startsWith("/document/") || url.pathname.startsWith("/spreadsheets/") || url.pathname.startsWith("/presentation/")),
    infer: (url) => {
      if (url.pathname.startsWith("/document/")) return { title: "Google Doc", description: "Google Docs" };
      if (url.pathname.startsWith("/spreadsheets/")) return { title: "Google Sheet", description: "Google Sheets" };
      return { title: "Google Slides", description: "Google Slides" };
    },
  },
];

/**
 * Try to infer metadata from the URL structure.
 * Returns null if no pattern matches.
 */
export function inferUrlMetadata(rawUrl: string): InferredMeta | null {
  try {
    const url = new URL(rawUrl);
    for (const rule of patterns) {
      if (rule.match(url)) {
        return rule.infer(url);
      }
    }
  } catch {
    // invalid URL
  }
  return null;
}
