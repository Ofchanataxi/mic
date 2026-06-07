import { useEffect, useRef } from 'react';
import { Camera, Mic, Radio } from 'lucide-react';

export default function CameraPreview({ stream }) {
  const videoRef = useRef(null);
  const active = Boolean(stream);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const indicators = [
    { icon: Camera, label: 'Cámara', active },
    { icon: Mic, label: 'Micrófono', active },
    { icon: Radio, label: 'Grabando', active },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
      {stream ? (
        <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
      ) : (
        <div className="flex aspect-video items-center justify-center text-sm text-slate-300">Cámara no iniciada</div>
      )}
      <div className="grid grid-cols-3 border-t border-slate-700 bg-slate-900 px-2 py-3">
        {indicators.map((indicator) => (
          <div key={indicator.label} className="flex flex-col items-center gap-1 text-center">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
              indicator.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}
            >
              <indicator.icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-slate-300">{indicator.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
