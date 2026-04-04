'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { CHINA_CITIES, type CityRecord } from '@/data/chinaCities';

interface CitySearchProps {
  value?: string;
  placeholder?: string;
  label?: string;
  onSelect: (city: CityRecord) => void;
  onInputChange?: (value: string) => void;
}

function matchCities(query: string): CityRecord[] {
  const rawQuery = query.trim();
  if (!rawQuery) return [];

  const normalized = rawQuery.toLowerCase();
  const collapsed = normalized.replace(/\s+/g, '');

  return CHINA_CITIES.filter((city) => {
    const pinyin = city.pinyin.toLowerCase();
    const collapsedPinyin = pinyin.replace(/\s+/g, '');
    const province = city.province.toLowerCase();

    return (
      city.name.includes(rawQuery) ||
      city.province.includes(rawQuery) ||
      pinyin.includes(normalized) ||
      province.includes(normalized) ||
      collapsedPinyin.includes(collapsed)
    );
  }).slice(0, 8);
}

export function CitySearch({
  value = '',
  placeholder = '输入城市或拼音',
  label,
  onSelect,
  onInputChange,
}: CitySearchProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => matchCities(query), [query]);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    if (query.trim() && suggestions.length) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [query, suggestions.length]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    onInputChange?.(value);
  };

  const handleSelect = (city: CityRecord) => {
    setQuery(city.name);
    setIsOpen(false);
    onSelect(city);
    onInputChange?.(city.name);
  };

  return (
    <div ref={wrapperRef} className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[#1C1A16]">{label}</label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1A16]/50" size={16} />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onChange={(event) => handleInput(event.target.value)}
          className="w-full h-11 rounded-xl border border-[#1C1A16]/15 bg-white pl-10 pr-3 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#1C1A16]/40 focus:ring-2 focus:ring-[#1C1A16]/10 outline-none transition-all"
        />
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-black/5 bg-white p-1 shadow-xl">
            {suggestions.map((city) => (
              <button
                key={`${city.name}-${city.province}`}
                type="button"
                onClick={() => handleSelect(city)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[#1C1A16] hover:bg-[#F5F3EF]"
              >
                <span className="font-medium">{city.name}</span>
                <span className="text-xs text-[#6B7280]">{city.province}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
