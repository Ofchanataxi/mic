import { useEffect, useRef, useState } from 'react';
import Button from './Button.jsx';
import Card, { CardBody, CardHeader } from './Card.jsx';

export default function SegmentedVideoPlayer({ videoUrl, question }) {
  const videoRef = useRef(null);
  const [mode, setMode] = useState('segment');

  const startSeconds = Number(question?.startTimeMs || 0) / 1000;
  const endSeconds = Number(question?.endTimeMs || 0) / 1000;
  const hasSegment = Number.isFinite(startSeconds) && Number.isFinite(endSeconds) && endSeconds > startSeconds;

  useEffect(() => {
    if (videoRef.current && hasSegment) {
      videoRef.current.currentTime = startSeconds;
    }
  }, [question?.questionId, hasSegment, startSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const onTimeUpdate = () => {
      if (mode === 'segment' && hasSegment && video.currentTime >= endSeconds) {
        video.pause();
        video.currentTime = endSeconds;
      }
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [mode, hasSegment, endSeconds]);

  const playSegment = () => {
    if (!videoRef.current || !hasSegment) return;
    setMode('segment');
    videoRef.current.currentTime = startSeconds;
    videoRef.current.play();
  };

  const restartSegment = () => {
    if (!videoRef.current || !hasSegment) return;
    videoRef.current.currentTime = startSeconds;
  };

  const playFullVideo = () => {
    if (!videoRef.current) return;
    setMode('full');
    videoRef.current.play();
  };

  return (
    <Card>
      <CardHeader title="Video de entrevista" description={hasSegment ? `Segmento ${Math.round(startSeconds)}s - ${Math.round(endSeconds)}s` : 'Segmento no disponible'} />
      <CardBody className="space-y-3">
        {videoUrl ? (
          <video ref={videoRef} src={videoUrl} controls className="aspect-video w-full rounded-md bg-slate-950" />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500">Video no disponible</div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={playSegment} disabled={!videoUrl || !hasSegment}>Reproducir segmento</Button>
          <Button variant="secondary" onClick={() => videoRef.current?.pause()} disabled={!videoUrl}>Pausar</Button>
          <Button variant="secondary" onClick={restartSegment} disabled={!videoUrl || !hasSegment}>Reiniciar segmento</Button>
          <Button variant="ghost" onClick={playFullVideo} disabled={!videoUrl}>Ver video completo</Button>
        </div>
      </CardBody>
    </Card>
  );
}
