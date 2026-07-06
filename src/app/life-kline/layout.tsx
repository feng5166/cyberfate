import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "人生K线",
  description: "基于八字命理的百年运势可视化，用金融K线的视角直观呈现大运流年的起伏节奏。",
};

export default function LifeKlineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
