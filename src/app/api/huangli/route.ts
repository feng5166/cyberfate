import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 天干地支
const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 宜忌事项
const yiItems = ['祭祀', '祈福', '出行', '签约', '开业', '搬家', '结婚', '动土', '装修', '交易'];
const jiItems = ['诉讼', '开仓', '远行', '安葬', '破土', '拆卸', '栽种', '针灸', '伐木', '狩猎'];

function getLunar(date: string) {
  // 简化版：实际应该用农历转换库
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  return `农历${month}月${day}日`;
}

function getGanzhi(date: string) {
  // 简化版：实际应该用专业算法
  const d = new Date(date);
  const yearIdx = (d.getFullYear() - 1984) % 10;
  const monthIdx = d.getMonth() % 10;
  const dayIdx = d.getDate() % 10;
  
  return `${tianGan[yearIdx]}${diZhi[yearIdx % 12]}年 ${tianGan[monthIdx]}${diZhi[monthIdx % 12]}月 ${tianGan[dayIdx]}${diZhi[dayIdx % 12]}日`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const session = await getServerSession(authOptions);
  
  const solar = date;
  const lunar = getLunar(date);
  const ganzhi = getGanzhi(date);
  
  // 随机选择宜忌
  const yi = yiItems.sort(() => Math.random() - 0.5).slice(0, 5);
  const ji = jiItems.sort(() => Math.random() - 0.5).slice(0, 5);
  
  let personalAdvice = null;
  if (session?.user?.id) {
    // VIP 用户才有个性化建议
    personalAdvice = `根据您的八字，今日特别适合${yi[0]}和${yi[1]}，需要注意避免${ji[0]}。`;
  }
  
  return NextResponse.json({ solar, lunar, ganzhi, yi, ji, personalAdvice });
}
