import { cn } from "@/lib/utils/cn";

interface TagProps {
  children: React.ReactNode;
  variant?: "wood" | "fire" | "earth" | "metal" | "water" | "default";
  className?: string;
}

const variantStyles = {
  wood: "bg-element-wood-bg text-element-wood-text",
  fire: "bg-element-fire-bg text-element-fire-text",
  earth: "bg-element-earth-bg text-element-earth-text",
  metal: "bg-element-metal-bg text-element-metal-text",
  water: "bg-element-water-bg text-element-water-text",
  default: "bg-gray-100 text-gray-700",
};

export function Tag({ children, variant = "default", className = "" }: TagProps) {
  return (
    <span className={cn("inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
