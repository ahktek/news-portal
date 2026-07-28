import { getLatestArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = "https://tangent.news";
  const escapedXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

  const latestArticles = await getLatestArticles(50);

  const items = latestArticles
    .map(
      (row) => `
    <item>
      <title>${escapedXml(row.title)}</title>
      <link>${siteUrl}/article/${escapedXml(row.slug)}</link>
      <description>${escapedXml(row.excerpt)}</description>
      <pubDate>${new Date(row.publishedAt).toUTCString()}</pubDate>
      <dc:creator>${escapedXml(row.author.name)}</dc:creator>
      <category>${escapedXml(row.category.name)}</category>
      <guid>${siteUrl}/article/${escapedXml(row.slug)}</guid>
    </item>`
    )
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>ট্যানজেন্ট — সংবাদ ও বিশ্লেষণ</title>
    <link>${siteUrl}</link>
    <description>বাংলাদেশ ও বৈশ্বিক রাজনীতি, অর্থনীতি, ক্রীড়া এবং সমসাময়িক বিষয়ের নিরপেক্ষ ও বস্তুনিষ্ঠ বিশ্লেষণ।</description>
    <language>bn-bd</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>TANGENT</generator>
    ${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}