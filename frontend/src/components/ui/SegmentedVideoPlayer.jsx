import { useEffect, useRef } from 'react';
import Card, { CardBody, CardHeader } from './Card.jsx';

export default function SegmentedVideoPlayer({
  videoUrl,
  question,
  onPlaybackError,
  embedded = false,
  unavailable = false,
}) {
  const videoRef = useRef(null);

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
      if (hasSegment && video.currentTime >= endSeconds) {
        video.pause();
        video.currentTime = endSeconds;
      }
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [hasSegment, endSeconds]);

  const content = (
    <>
      {embedded ? (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-950">Fragmento de la respuesta</h3>
          <p className="mt-1 text-sm text-slate-500">
            {hasSegment ? 'Video correspondiente a esta pregunta.' : 'Fragmento no disponible.'}
          </p>
        </div>
      ) : null}
        {videoUrl ? (
          <video
            key={videoUrl}
            ref={videoRef}
            src={videoUrl}
            controls
            preload="metadata"
            onError={onPlaybackError}
            className="aspect-video w-full rounded-md bg-slate-950"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-md bg-slate-100 px-6 text-center text-sm text-slate-500">
            {unavailable
              ? 'El archivo de video de esta entrevista ya no está disponible.'
              : 'Preparando video...'}
          </div>
        )}
    </>
  );

  if (embedded) {
    return <section>{content}</section>;
  }

  return (
    <Card>
      <CardHeader title="Video de entrevista" description={hasSegment ? 'Fragmento correspondiente a esta pregunta' : 'Fragmento no disponible'} />
      <CardBody className="space-y-3">
        {content}
      </CardBody>
    </Card>
  );
}
