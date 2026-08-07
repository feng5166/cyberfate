import { PageSkeleton } from '@/components/ui/PageSkeleton';

// 路由切换即时反馈：命理纸面骨架替代白屏（内容页布局）
export default function Loading() {
  return <PageSkeleton variant="result" />;
}
