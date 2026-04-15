export default function robots() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
