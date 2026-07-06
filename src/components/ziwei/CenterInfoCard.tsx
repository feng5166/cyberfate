'use client';

import { CenterUserInfo, PalaceData } from './types';

interface CenterInfoCardProps {
  userInfo?: CenterUserInfo;
  palaces: PalaceData[];
  className?: string;
}

function formatSolarBirthday(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

export function CenterInfoCard({ userInfo, palaces, className = '' }: CenterInfoCardProps) {
  if (!userInfo) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-[#1C1A16]/10 bg-[#FAF9F6]/60 p-4 ${className}`}>
        <span className="text-2xl mb-1">☯</span>
        <span className="text-xs text-[#1C1A16]/40 tracking-widest">紫微斗数命盘</span>
      </div>
    );
  }

  const lifePalace = palaces.find((p) => p.isLife);
  const genderLabel = userInfo.gender === 'male' ? '男' : '女';
  const lifePalaceMajorStars = lifePalace?.majorStars.map((s) => s.name).join(' ') || '';

  const titleParts = [
    userInfo.name || '命主',
    genderLabel,
    userInfo.wuxingju,
  ].filter(Boolean);

  return (
    <div className={`bg-white rounded-2xl border border-[#1C1A16]/8 p-6 text-center ${className}`}>
      <div className="space-y-1.5">
        {/* 1. 标题行 */}
        <p className="text-lg font-semibold font-display text-[#1C1A16]">
          {titleParts.join(' · ')}
        </p>

        {/* 2. 命主 · 身主 */}
        {(userInfo.mingzhu || userInfo.shenzhu) && (
          <p className="text-sm text-[#1C1A16]/70">
            {userInfo.mingzhu && <>命主 {userInfo.mingzhu}</>}
            {userInfo.mingzhu && userInfo.shenzhu && ' · '}
            {userInfo.shenzhu && <>身主 {userInfo.shenzhu}</>}
          </p>
        )}

        {/* 3. 命宫信息 */}
        {lifePalace && (
          <p className="text-sm text-[#1C1A16]/70">
            命宫 {lifePalace.branch}
            {lifePalaceMajorStars && ` · ${lifePalaceMajorStars}`}
          </p>
        )}

        {/* 4. 输入时间 */}
        {userInfo.inputTime && (
          <p className="text-sm text-[#1C1A16]/70">
            输入时间 {userInfo.inputTime}
          </p>
        )}

        {/* 5. 真太阳时（有修正时才显示） */}
        {userInfo.solarTime && (
          <p className="text-sm text-[#1C1A16]/70">
            真太阳时 {userInfo.solarTime}
          </p>
        )}

        {/* 6. 阳历生日 */}
        {userInfo.solarBirthday && (
          <p className="text-sm text-[#1C1A16]/70">
            阳历生日 {formatSolarBirthday(userInfo.solarBirthday)}
          </p>
        )}

        {/* 7. 农历生日 */}
        {userInfo.lunarBirthday && (
          <p className="text-sm text-[#1C1A16]/70">
            {userInfo.lunarBirthday}
          </p>
        )}
      </div>
    </div>
  );
}
