interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className = "" }: PageHeaderProps) {
  return (
    <div className={`text-center pt-16 md:pt-20 pb-8 ${className}`}>
      <h1 className="text-h1 font-semibold text-brand-black">{title}</h1>
      {subtitle && (
        <p className="text-body-sm text-brand-gray mt-3">{subtitle}</p>
      )}
    </div>
  );
}
