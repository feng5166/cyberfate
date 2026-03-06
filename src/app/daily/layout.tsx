import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "每日运势",
  description: "基于八字的个性化每日运势分析。查看今日事业、财运、感情、健康运势，宜忌提示，幸运色和幸运数字。",
};

export default function DailyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
