import { useRef } from 'react';
import { Trash2, UploadCloud } from 'lucide-react';
import Card, { CardBody, CardHeader } from './Card.jsx';

export default function FileUploadCard({ title, description, accept, file, onFileChange, children }) {
  const inputRef = useRef(null);

  const handleSelection = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    const accepted = onFileChange(selectedFile);
    if (accepted === false) event.target.value = '';
  };

  const removeFile = () => {
    if (inputRef.current) inputRef.current.value = '';
    onFileChange(null);
  };

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50">
          <UploadCloud className="mb-3 h-8 w-8 text-brand-600" />
          <span className="text-sm font-semibold text-slate-950">{file ? file.name : 'Seleccionar archivo'}</span>
          <span className="mt-1 text-xs text-slate-500">{accept === 'application/pdf' ? 'Solo archivos PDF' : 'Archivo compatible'}</span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={handleSelection}
          />
        </label>
        {file ? (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={removeFile}
          >
            <Trash2 className="h-4 w-4" />
            Quitar archivo
          </button>
        ) : null}
        {children}
      </CardBody>
    </Card>
  );
}
