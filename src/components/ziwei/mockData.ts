import { PalaceData } from './types';

/**
 * 紫微斗数标准命盘 4x3 网格排列（按传统逆时针排法）
 *
 * 视觉布局（桌面端 4 列 x 3 行）:
 *   [巳]   [午]   [未]   [申]
 *   [辰]               [酉]
 *   [卯]   [寅]   [丑]   [子]
 *
 * 十二宫按逆时针从寅宫起排：
 *   第一行(top):    巳(idx 3) | 午(idx 4) | 未(idx 5) | 申(idx 6)
 *   第二行(mid-L):  辰(idx 2)                          | 酉(idx 7)
 *   第三行(bottom): 卯(idx 1) | 寅(idx 0) | 丑(idx 11) | 子(idx 10)
 *
 * 中间 2x2 区域留空（放标题/信息）
 */

const BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

export const MOCK_PALACES: PalaceData[] = [
  {
    name: '命宫',
    branch: '辰',
    stem: '庚',
    isLife: true,
    majorStars: [
      { name: '紫微', type: 'major', brightness: '庙' },
      { name: '天府', type: 'major', brightness: '庙' },
    ],
    minorStars: [
      { name: '文昌', type: 'auxiliary', brightness: '旺' },
      { name: '左辅', type: 'auxiliary', brightness: '庙' },
    ],
  },
  {
    name: '兄弟',
    branch: '巳',
    stem: '辛',
    majorStars: [
      { name: '太阳', type: 'major', brightness: '旺' },
    ],
    minorStars: [
      { name: '天魁', type: 'auxiliary', brightness: '庙' },
    ],
  },
  {
    name: '夫妻',
    branch: '午',
    stem: '壬',
    majorStars: [
      { name: '武曲', type: 'major', brightness: '得' },
      { name: '天相', type: 'major', brightness: '庙' },
    ],
    minorStars: [
      { name: '文曲', type: 'auxiliary', brightness: '旺' },
    ],
  },
  {
    name: '子女',
    branch: '未',
    stem: '癸',
    majorStars: [
      { name: '太阴', type: 'major', brightness: '陷' },
    ],
    minorStars: [
      { name: '铃星', type: 'evil', brightness: '陷' },
    ],
  },
  {
    name: '财帛',
    branch: '申',
    stem: '甲',
    majorStars: [
      { name: '贪狼', type: 'major', brightness: '旺' },
    ],
    minorStars: [
      { name: '右弼', type: 'auxiliary', brightness: '庙' },
      { name: '天钺', type: 'auxiliary', brightness: '旺' },
    ],
  },
  {
    name: '疾厄',
    branch: '酉',
    stem: '乙',
    majorStars: [
      { name: '天同', type: 'major', brightness: '得' },
      { name: '巨门', type: 'major', brightness: '旺' },
    ],
    minorStars: [
      { name: '擎羊', type: 'evil', brightness: '陷' },
    ],
  },
  {
    name: '迁移',
    branch: '戌',
    stem: '丙',
    majorStars: [
      { name: '廉贞', type: 'major', brightness: '平' },
    ],
    minorStars: [
      { name: '火星', type: 'evil', brightness: '利' },
      { name: '地空', type: 'evil', brightness: '平' },
    ],
  },
  {
    name: '交友',
    branch: '亥',
    stem: '丁',
    majorStars: [
      { name: '天机', type: 'major', brightness: '庙' },
      { name: '天梁', type: 'major', brightness: '庙' },
    ],
    minorStars: [
      { name: '陀罗', type: 'evil', brightness: '陷' },
    ],
  },
  {
    name: '官禄',
    branch: '子',
    stem: '戊',
    majorStars: [
      { name: '七杀', type: 'major', brightness: '旺' },
    ],
    minorStars: [
      { name: '地劫', type: 'evil', brightness: '平' },
    ],
  },
  {
    name: '田宅',
    branch: '丑',
    stem: '己',
    majorStars: [
      { name: '破军', type: 'major', brightness: '庙' },
    ],
    minorStars: [
      { name: '禄存', type: 'auxiliary', brightness: '庙' },
    ],
  },
  {
    name: '福德',
    branch: '寅',
    stem: '庚',
    majorStars: [],
    minorStars: [
      { name: '天马', type: 'auxiliary', brightness: '旺' },
    ],
  },
  {
    name: '父母',
    branch: '卯',
    stem: '辛',
    majorStars: [],
    minorStars: [
      { name: '天姚', type: 'minor', brightness: '平' },
      { name: '红鸾', type: 'minor', brightness: '旺' },
    ],
  },
];
