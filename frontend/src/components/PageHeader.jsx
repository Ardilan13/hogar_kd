export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wide text-berry mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display font-semibold text-2xl sm:text-3xl">{title}</h1>
        {description && <p className="text-sm text-ink/55 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
