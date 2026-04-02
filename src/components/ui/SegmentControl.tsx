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
}

export function SegmentControl({ options, value, onChange, defaultValue, className = "" }: SegmentControlProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || options[0]?.value || "");
  const selectedValue = value ?? internalValue;

  const handleChange = (val: string) => {
    if (onChange) onChange(val);
    else setInternalValue(val);
  };

  return (
    <div className={cn("inline-flex rounded-lg overflow-hidden border border-brand-border w-full", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleChange(opt.value)}
          className={cn(
            "flex-1 px-6 py-2.5 text-sm transition-all duration-200 cursor-pointer text-center",
            selectedValue === opt.value
              ? "bg-brand-black text-white"
              : "bg-gray-100 text-brand-gray hover:bg-gray-200"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
