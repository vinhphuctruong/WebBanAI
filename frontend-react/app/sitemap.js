import { fetchPublicJson } from "../src/lib/serverApi.js";

const STATIC_PATHS = [
  "",
  "/ai-tools",
  "/chatbotprompt",
  "/pricing"
];

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173").replace(/\/$/, "");
}

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const urls = STATIC_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.8
  }));

  try {
    const [gems, tools] = await Promise.all([
      fetchPublicJson("/catalog/gems", { revalidate: 3600 }),
      fetchPublicJson("/catalog/ai-tools", { revalidate: 3600 })
    ]);

    gems.forEach((item) => {
      urls.push({
        url: `${siteUrl}/chatbotprompt/${item.slug}`,
        changeFrequency: "weekly",
        priority: 0.7
      });
    });

    tools.forEach((item) => {
      urls.push({
        url: `${siteUrl}/ai-tool/${item.slug}`,
        changeFrequency: "weekly",
        priority: 0.7
      });
    });
  } catch (_err) {
    // Keep static URLs if dynamic catalog data is temporarily unavailable.
  }

  return urls;
}
