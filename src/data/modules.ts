// ===== 模块 IA 唯一真源 =====
// 桌面侧栏 / 首页 Header / 手机抽屉 / 底部 TabBar / Footer 五个导航面，历史上各存一份
// 互相打架的模块目录（合婚有 3 个名字、黄历/紫微各 2 个、分组名 desktop≠mobile）。
// 此处收敛为唯一注册表，所有导航面从这里派生 —— 标签/分组/图标/收费标记改一处全站生效。
import {
  BarChart3, Star, BookHeart, Layers, Coins, Flower2,
  Sun, Sparkles, CalendarDays, Music, BookOpen, Gem, CandlestickChart,
  type LucideIcon,
} from 'lucide-react';

export type ModuleGroupKey = 'mingli' | 'zhanbu' | 'kaiyun';

export interface ModuleItem {
  id: string;
  href: string;
  label: string;        // 唯一规范全称
  short: string;        // 短名（TabBar/窄容器用）
  desc: string;         // 一句话说明（Header mega-menu / 抽屉用）
  icon: LucideIcon;
  group: ModuleGroupKey;
  paidOnly?: boolean;
  featured?: boolean;   // 高频入口：桌面顶部主导航 + 底部 TabBar
}

export const MODULE_GROUP_META: Record<ModuleGroupKey, { title: string }> = {
  mingli: { title: '东方命理' },
  zhanbu: { title: '占卜决策' },
  kaiyun: { title: '每日开运' },
};

export const MODULES: ModuleItem[] = [
  { id: 'bazi',     href: '/bazi',           label: '八字分析',   short: '八字', desc: 'AI 排盘，解读命盘特质与运势',   icon: BarChart3,   group: 'mingli', featured: true },
  { id: 'ziwei',    href: '/ziwei',          label: '紫微斗数',   short: '紫微', desc: '十二宫位与主星格局精解',       icon: Star,        group: 'mingli', paidOnly: true },
  { id: 'marriage', href: '/bazi/marriage',  label: '合婚配对',   short: '合婚', desc: '双方八字深度匹配度分析',       icon: BookHeart,   group: 'mingli', paidOnly: true },
  { id: 'lifekline',href: '/life-kline',     label: '人生K线',    short: 'K线', desc: '百年运势可视化，K线看人生起伏', icon: CandlestickChart, group: 'mingli' },

  { id: 'tarot',    href: '/tarot',          label: '塔罗占卜',   short: '塔罗', desc: 'AI 塔罗，多角度看清处境',      icon: Layers,      group: 'zhanbu', featured: true },
  { id: 'liuyao',   href: '/liuyao',         label: '六爻占卜',   short: '六爻', desc: '传统六爻 + AI 深度解卦',       icon: Coins,       group: 'zhanbu', paidOnly: true },
  { id: 'meihua',   href: '/meihua',         label: '梅花易数',   short: '梅花', desc: '随时起卦，助你做关键决策',     icon: Flower2,     group: 'zhanbu', paidOnly: true },

  { id: 'daily',    href: '/daily',          label: '每日运势',   short: '运势', desc: '每日吉凶与开运指引',           icon: Sun,         group: 'kaiyun', featured: true },
  { id: 'shengxiao',href: '/2026',           label: '生肖运势',   short: '生肖', desc: '丙午马年十二生肖全解',         icon: Sparkles,    group: 'kaiyun' },
  { id: 'huangli',  href: '/huangli',        label: '黄历查询',   short: '黄历', desc: '宜忌吉日，AI 智能择日',        icon: CalendarDays,group: 'kaiyun', paidOnly: true },
  { id: 'music',    href: '/music-oracle',   label: '音乐运势签', short: '音乐', desc: '抽一签，听见你的运势',         icon: Music,       group: 'kaiyun' },
];

// 三个分组 + 其下模块，供侧栏/抽屉/mega-menu 直接渲染。
export const MODULE_GROUPS: { key: ModuleGroupKey; title: string; items: ModuleItem[] }[] =
  (Object.keys(MODULE_GROUP_META) as ModuleGroupKey[]).map((key) => ({
    key,
    title: MODULE_GROUP_META[key].title,
    items: MODULES.filter((m) => m.group === key),
  }));

// 非模块入口（知识库/定价），导航面单独排布。
export const EXTRA_LINKS = [
  { id: 'knowledge', href: '/knowledge', label: '命理知识库', short: '知识', desc: '术语图解与入门科普', icon: BookOpen },
  { id: 'pricing',   href: '/pricing',   label: '定价',       short: '定价', desc: '会员权益与价格',     icon: Gem },
] as const;

// 高频入口：桌面顶部主导航 + 底部 TabBar（配合 首页 与 更多）。
export const FEATURED_MODULES = MODULES.filter((m) => m.featured);

const norm = (p?: string) => (!p ? '/' : p === '/' ? '/' : p.replace(/\/$/, '') || '/');

/** 按当前路径命中模块（含子路径，如 /bazi/xxx 命中八字；/bazi/marriage 优先命中合婚）。 */
export function moduleByPath(pathname?: string): ModuleItem | undefined {
  const p = norm(pathname);
  // 先精确/最长前缀匹配，保证 /bazi/marriage 不被 /bazi 抢先。
  const sorted = [...MODULES].sort((a, b) => b.href.length - a.href.length);
  return sorted.find((m) => p === m.href || p.startsWith(m.href + '/'));
}
