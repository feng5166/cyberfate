import { MetadataRoute } from "next";
import { knowledgeData } from "@/data/knowledge";

const baseUrl = "https://www.cyberfate.me";

// 静态页的稳定 lastModified。仅在页面内容实际变更时手动更新此日期，
// 避免每次 build 都把 lastmod 刷成「现在」而被搜索引擎判为虚假更新信号。
const STATIC_LAST_MODIFIED = new Date("2026-06-18");

export default function sitemap(): MetadataRoute.Sitemap {
  const knowledgeArticles: MetadataRoute.Sitemap = Object.keys(knowledgeData).map((slug) => ({
    url: `${baseUrl}/knowledge/${slug}`,
    lastModified: new Date(knowledgeData[slug].date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: `${baseUrl}/`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/bazi`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/bazi/marriage`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/life-kline`, lastModified: new Date("2026-08-01"), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/life-kline/compare`, lastModified: new Date("2026-08-01"), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/daily`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/tarot`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/ziwei`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/meihua`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/liuyao`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/music-oracle`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/huangli`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/today`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
    { url: `${baseUrl}/pricing`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/knowledge`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/2026`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/2026/caiyun`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/2026/shiyeyun`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/2026/aiqingyun`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.85 },
    ...knowledgeArticles,
  ];
}
