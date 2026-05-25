export default function Input({ label, id, error, className = '', ...props }) {
  return (
    <label htmlFor={id} className="block">
      {label ? <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span> : null}
      <input
        id={id}
        className={`focus-ring h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 ${className}`}
        {...props}
      />
      {error ? <span className="mt-1 block text-sm text-rose-600">{error}</span> : null}
    </label>
  );
}
