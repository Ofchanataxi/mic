export default function Select({ label, id, children, className = '', ...props }) {
  return (
    <label htmlFor={id} className="block">
      {label ? <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span> : null}
      <select
        id={id}
        className={`focus-ring h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
