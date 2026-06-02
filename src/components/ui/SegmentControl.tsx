'use client';

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentControlProps {
  options: SegmentOption[];
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
  optionClassName?: string;
}

export function SegmentControl({
  options,
  value,
  onChange,
  defaultValue,
  className = "",
  optionClassName = "",
}: SegmentControlProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || options[0]?.value || "");
  const selectedValue = value ?? internalValue;

  const handleChange = (val: string) => {
    if (onChange) onChange(val);
    else setInternalValue(val);
  };

  return (
    <div className={cn("inline-flex rounded-2xl overflow-hidden border border-[#E5E0D8] w-full bg-white", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleChange(opt.value)}
          className={cn(
            "flex-1 px-2 md:px-6 py-2.5 text-xs md:text-sm transition-all duration-200 cursor-pointer text-center",
            selectedValue === opt.value
              ? "bg-[#FAF3EC] text-[#1C1A16] font-medium shadow-[inset_0_0_0_1.5px_#C2762B]"
              : "bg-transparent text-[#1C1A16]/55 hover:bg-[#FAF9F6]",
            optionClassName
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
