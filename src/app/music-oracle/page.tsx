import type { Metadata } from 'next';
import PageClient from './PageClient';

export const metadata: Metadata = {
  title: '音乐运势签 | CyberFate',
  description: '带着你的问题，让命理为你指引今天的歌。基于八字日主五行、当日天干、问题关键词三重匹配，AI生成专属签文解读。',
  keywords: ['音乐运势签', '命理音乐', 'AI签文', '五行音乐', '歌曲推荐', '命运之歌'],
  openGraph: {
    title: '🎵 音乐运势签 · Music Oracle',
    description: '带着你的问题，让命理为你指引今天的歌',
    type: 'website',
  },
};

export default function MusicOraclePage() {
  return <PageClient />;
}
