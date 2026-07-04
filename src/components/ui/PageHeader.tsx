interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

// 内页标题统一件：移动端收紧顶距与字号，桌面端放大；字号走 token。
export function PageHeader({ title, subtitle, className = "" }: PageHeaderProps) {
  return (
    <div className={`text-center pt-10 sm:pt-14 md:pt-20 pb-8 ${className}`}>
      <h1 className="text-[26px] sm:text-[32px] md:text-h1 font-semibold text-brand-ink">{title}</h1>
      {subtitle && (
        <p className="text-body-sm text-brand-gray mt-3">{subtitle}</p>
      )}
    </div>
  );
}
