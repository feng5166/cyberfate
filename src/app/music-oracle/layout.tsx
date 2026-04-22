import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '音乐运势签 · Music Oracle',
  description: '带着你的问题，让命理为你指引今天的歌。基于八字五行的AI音乐运势签，不是随机，是命运的回响。',
};

export default function MusicOracleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
