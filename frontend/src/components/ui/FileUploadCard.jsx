import { UploadCloud } from 'lucide-react';
import Card, { CardBody, CardHeader } from './Card.jsx';

export default function FileUploadCard({ title, description, accept, file, onFileChange, children }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50">
          <UploadCloud className="mb-3 h-8 w-8 text-brand-600" />
          <span className="text-sm font-semibold text-slate-950">{file ? file.name : 'Seleccionar archivo'}</span>
          <span className="mt-1 text-xs text-slate-500">{accept === 'application/pdf' ? 'PDF' : 'Archivo compatible'}</span>
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          />
        </label>
        {children}
      </CardBody>
    </Card>
  );
}
