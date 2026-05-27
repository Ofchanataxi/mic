import { BrainCircuit } from 'lucide-react';

export default function AuthShell({ title, description, children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden flex-1 bg-brand-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold">MIC Interviews</p>
            <p className="text-sm text-indigo-100">Plataforma de entrevistas técnicas</p>
          </div>
        </div>
        <div className="max-w-lg">
          <h1 className="text-3xl font-bold leading-tight">Entrevistas técnicas con evidencia multimodal.</h1>
          <p className="mt-4 text-sm leading-6 text-indigo-100">
            Gestiona tu perfil, tus entrevistas y tus reportes en un solo lugar.
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
