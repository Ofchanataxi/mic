import Spinner from './Spinner.jsx';

export default function LoadingState({ label = 'Cargando' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
      <Spinner label={label} />
    </div>
  );
}
