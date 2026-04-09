'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/ui/Container';
import { DatePicker } from '@/components/ui/DatePicker';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import {
  PalaceGrid,
  PalaceMobileList,
  StarIcon,
  SHICHEN_OPTIONS,
  MOCK_PALACES,
  STAR_COLORS,
} from '@/components/ziwei';
import type { PalaceData } from '@/components/ziwei';

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

export default function ZiweiPage() {
  // 表单状态
  const [birthDate, setBirthDate] = useState('1990-06-15');
  const [birthHour, setBirthHour] = useState('3');
  const [gender, setGender] = useState('male');

  // 结果状态
  const [palaces, setPalaces] = useState<PalaceData[]>(MOCK_PALACES);
  const [showChart, setShowChart] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(0);

  const selectedPalace = useMemo(() => {
    if (selectedPalaceIndex === null || !palaces[selectedPalaceIndex]) return null;
    return palaces[selectedPalaceIndex];
  }, [selectedPalaceIndex, palaces]);

  const handleSubmit = async () => {
    if (!birthDate || !birthHour) return;

    setLoading(true);
    // 模拟排盘计算延迟，后续接真实 API
    await new Promise((r) => setTimeout(r, 800));
    setPalaces(MOCK_PALACES);
    setShowChart(true);
    setSelectedPalaceIndex(0);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* 面包屑 */}
      <Container className="pt-20 md:pt-24">
        <nav className="flex items-center gap-1.5 text-sm text-[#1C1A16]/50 mb-6">
          <Link href="/" className="hover:text-[#1C1A16] transition-colors">
            首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1C1A16]">紫微斗数</span>
        </nav>
      </Container>

      {/* 标题区 */}
      <Container className="pb-8">
        <div className="text-center">
          <h1 className="font-display text-3xl md:text-[40px] font-bold text-[#1C1A16] leading-tight">
            AI 紫微斗数排盘
          </h1>
          <p className="mt-3 text-sm md:text-base text-[#1C1A16]/55 tracking-wider">
            十二宫命盘 · 智能解读
          </p>
        </div>
      </Container>

      {/* 输入区 */}
      <Container className="pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* 出生日期 */}
            <div className="flex-1 relative">
              <DatePicker
                value={birthDate}
                onChange={setBirthDate}
                label="出生日期"
                triggerClassName="border-[#E8E4DD] focus:border-[#1C1A16]"
              />
            </div>

            {/* 出生时辰 */}
            <div className="flex-1">
              <Select
                label="出生时辰"
                value={birthHour}
                onChange={(e) => setBirthHour(e.target.value)}
                options={SHICHEN_OPTIONS}
                placeholder="请选择时辰"
                className="border-[#E8E4DD] focus:border-[#1C1A16]"
              />
            </div>

            {/* 性别 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#1C1A16] mb-2">性别</label>
              <SegmentControl
                options={GENDER_OPTIONS}
                value={gender}
                onChange={setGender}
              />
            </div>

            {/* 排盘按钮 */}
            <div className="md:shrink-0">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={loading}
                className="w-full md:w-auto whitespace-nowrap"
              >
                开始排盘
              </Button>
            </div>
          </div>
        </div>
      </Container>

      {/* 命盘区域 */}
      {loading && (
        <Container className="pb-16">
          <div className="flex flex-col items-center justify-center py-20">
            <BaguaSpinner />
            <p className="mt-4 text-sm text-[#1C1A16]/50">正在排盘中...</p>
          </div>
        </Container>
      )}

      {showChart && !loading && palaces.length > 0 && (
        <Container className="pb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-4 sm:p-6">
            <h2 className="font-display text-xl md:text-2xl font-semibold text-[#1C1A16] mb-1 text-center">
              命盘
            </h2>
            <p className="text-xs text-[#1C1A16]/40 text-center mb-5">
              点击宫格查看详情
            </p>

            {/* 桌面端：4×4 网格 */}
            <div className="hidden md:block">
              <PalaceGrid
                palaces={palaces}
                selectedIndex={selectedPalaceIndex}
                onSelect={setSelectedPalaceIndex}
              />
            </div>

            {/* 移动端：纵向列表 */}
            <div className="md:hidden">
              <PalaceMobileList
                palaces={palaces}
                selectedIndex={selectedPalaceIndex}
                onSelect={setSelectedPalaceIndex}
              />
            </div>
          </div>
        </Container>
      )}

      {/* 选中宫位详情（简要） */}
      {showChart && !loading && selectedPalace && (
        <Container className="pb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-display text-lg font-semibold text-[#1C1A16]">
                {selectedPalace.name}
              </h3>
              <span className="text-sm text-[#1C1A16]/40">
                {selectedPalace.stem}{selectedPalace.branch}
              </span>
              {selectedPalace.isLife && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C1A16]/8 text-[#1C1A16]/70 font-medium">
                  命宫
                </span>
              )}
            </div>

            {/* 星曜列表 */}
            <div className="space-y-3">
              {selectedPalace.majorStars.length > 0 && (
                <div>
                  <span className="text-xs text-[#1C1A16]/40 mb-2 block">主星</span>
                  <div className="flex flex-wrap gap-3">
                    {selectedPalace.majorStars.map((star) => (
                      <div
                        key={star.name}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4DD]"
                      >
                        <StarIcon starName={star.name} size={10} />
                        <span
                          className="text-sm font-semibold"
                          style={{ color: STAR_COLORS[star.name] || '#1C1A16' }}
                        >
                          {star.name}
                        </span>
                        {star.brightness && (
                          <span className="text-[11px] text-[#1C1A16]/40 border border-[#E8E4DD] rounded px-1.5 py-0.5">
                            {star.brightness}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPalace.minorStars.length > 0 && (
                <div>
                  <span className="text-xs text-[#1C1A16]/40 mb-2 block">辅星 / 煞星</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPalace.minorStars.map((star) => (
                      <span
                        key={star.name}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                          star.type === 'evil'
                            ? 'border-red-200 bg-red-50/50 text-red-500'
                            : 'border-[#E8E4DD] bg-[#FAF9F6] text-[#1C1A16]/60'
                        }`}
                      >
                        {star.name}
                        {star.brightness && ` · ${star.brightness}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-[#1C1A16]/30 italic">
              AI 解读功能即将上线，敬请期待...
            </p>
          </div>
        </Container>
      )}

      <Footer />
    </div>
  );
}
