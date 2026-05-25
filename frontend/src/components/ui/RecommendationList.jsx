export default function RecommendationList({ title, items = [] }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
        {list.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-md bg-slate-50 px-3 py-2">{String(item)}</li>
        ))}
      </ul>
    </div>
  );
}
