import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "八字分析",
  description: "输入出生时间，AI 为你计算四柱八字，深度解读命理。包含五行分析、日主解读、事业财运感情健康全方位分析。",
};

export default function BaziLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
