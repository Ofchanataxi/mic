import { useEffect, useRef } from 'react';
import Card, { CardBody, CardHeader } from './Card.jsx';

export default function SegmentedVideoPlayer({ videoUrl, question }) {
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

  return (
    <Card>
      <CardHeader title="Video de entrevista" description={hasSegment ? `Segmento ${Math.round(startSeconds)}s - ${Math.round(endSeconds)}s` : 'Segmento no disponible'} />
      <CardBody className="space-y-3">
        {videoUrl ? (
          <video ref={videoRef} src={videoUrl} controls className="aspect-video w-full rounded-md bg-slate-950" />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500">Video no disponible</div>
        )}
      </CardBody>
    </Card>
  );
}
