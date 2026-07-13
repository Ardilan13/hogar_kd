export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card flex flex-col items-center text-center gap-2 py-14 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-blush text-berry flex items-center justify-center mb-1">
          <Icon size={22} />
        </div>
      )}
      <p className="font-display font-semibold text-lg">{title}</p>
      {description && <p className="text-sm text-ink/55 max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
