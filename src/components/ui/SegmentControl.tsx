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
    <div className={cn("inline-flex rounded-2xl overflow-hidden border border-[#1C1A16]/12 w-full", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleChange(opt.value)}
          className={cn(
            "flex-1 px-6 py-2.5 text-sm transition-all duration-200 cursor-pointer text-center",
            selectedValue === opt.value
              ? "bg-[#1C1A16] text-white"
              : "bg-white text-[#1C1A16]/70 hover:bg-[#FAF9F6]",
            optionClassName
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
