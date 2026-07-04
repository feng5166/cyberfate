import { cn } from '@/lib/utils/cn';

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

// 表单字段统一外壳：label + 控件 + 错误/提示。控件本身用 <Input> 或走 input-recipe 类。
// 各模块表单迁移到这里后，标签排版/错误态/间距全站一致。
export function FormField({
  label, htmlFor, error, hint, required, className = '', children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-brand-gray">
          {label}
          {required && <span className="ml-0.5 text-brand-accent">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-brand-gray">{hint}</p>
      ) : null}
    </div>
  );
}

// 供非 <Input> 的自定义控件（select/触发器等）复用同一套视觉的类配方。
// text-base(16px) 防 iOS 聚焦缩放；min-h-[44px] 触控达标；focus 走强调色环。
export const inputRecipe =
  'w-full min-h-[44px] px-4 py-3 rounded-xl bg-white text-base text-brand-ink placeholder:text-brand-light ' +
  'border border-brand-border transition-colors focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/25';
