'use client';

import { useState, useEffect, useRef } from 'react';

interface City {
  name: string;
  province: string;
  timezone: string;
}

interface CitySearchProps {
  value: string;
  onChange: (city: City) => void;
  label?: string;
  placeholder?: string;
}

// 简化的城市数据（实际应该从API或数据库读取）
const CITIES: City[] = [
  { name: '北京市', province: '北京', timezone: 'UTC+8' },
  { name: '上海市', province: '上海', timezone: 'UTC+8' },
  { name: '广州市', province: '广东', timezone: 'UTC+8' },
  { name: '深圳市', province: '广东', timezone: 'UTC+8' },
  { name: '杭州市', province: '浙江', timezone: 'UTC+8' },
  { name: '成都市', province: '四川', timezone: 'UTC+8' },
  { name: '重庆市', province: '重庆', timezone: 'UTC+8' },
  { name: '天津市', province: '天津', timezone: 'UTC+8' },
  { name: '南京市', province: '江苏', timezone: 'UTC+8' },
  { name: '武汉市', province: '湖北', timezone: 'UTC+8' },
  { name: '西安市', province: '陕西', timezone: 'UTC+8' },
  { name: '郑州市', province: '河南', timezone: 'UTC+8' },
  { name: '长沙市', province: '湖南', timezone: 'UTC+8' },
  { name: '济南市', province: '山东', timezone: 'UTC+8' },
  { name: '青岛市', province: '山东', timezone: 'UTC+8' },
  { name: '大连市', province: '辽宁', timezone: 'UTC+8' },
  { name: '沈阳市', province: '辽宁', timezone: 'UTC+8' },
  { name: '厦门市', province: '福建', timezone: 'UTC+8' },
  { name: '福州市', province: '福建', timezone: 'UTC+8' },
  { name: '昆明市', province: '云南', timezone: 'UTC+8' },
];

// 拼音首字母映射（简化版）
const PINYIN_MAP: Record<string, string[]> = {
  b: ['北京', '保定'],
  s: ['上海', '深圳', '沈阳', '石家庄'],
  g: ['广州', '贵阳'],
  h: ['杭州', '合肥', '哈尔滨'],
  c: ['成都', '长沙', '长春'],
  w: ['武汉'],
  x: ['西安', '厦门'],
  // ... 更多城市拼音映射
};

export function CitySearch({ value, onChange, label, placeholder = '输入城市名' }: CitySearchProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 搜索逻辑（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!input.trim()) {
        setSuggestions([]);
        return;
      }

      const query = input.toLowerCase();
      const matches = CITIES.filter(city => {
        // 城市名匹配
        if (city.name.includes(input) || city.province.includes(input)) {
          return true;
        }
        // 简单拼音匹配
        for (const [letter, names] of Object.entries(PINYIN_MAP)) {
          if (query.startsWith(letter) && names.some(name => city.name.includes(name))) {
            return true;
          }
        }
        return false;
      }).slice(0, 10); // 限制 10 条

      setSuggestions(matches);
      setShowDropdown(matches.length > 0);
    }, 300); // 300ms 防抖

    return () => clearTimeout(timer);
  }, [input]);

  const handleSelect = (city: City) => {
    setInput(city.name);
    setShowDropdown(false);
    onChange(city);
  };

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      {label && (
        <label className="block text-sm font-medium text-secondary">
          {label}
        </label>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        className="w-full px-4 py-3 rounded bg-white border border-border text-primary placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
      />
      
      {/* 下拉候选列表 */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((city, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full px-4 py-2 text-left hover:bg-primary/10 transition-colors flex justify-between items-center"
            >
              <span className="text-primary">{city.name}</span>
              <span className="text-xs text-muted">{city.province}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
