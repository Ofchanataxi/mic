export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      {Icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
