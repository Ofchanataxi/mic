import { useEffect, useRef } from 'react';

export default function CameraPreview({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
      {stream ? (
        <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
      ) : (
        <div className="flex aspect-video items-center justify-center text-sm text-slate-300">Camara no iniciada</div>
      )}
    </div>
  );
}
