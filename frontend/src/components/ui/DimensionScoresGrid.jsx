import ScoreCard from './ScoreCard.jsx';

const labels = {
  technical: 'Habilidades técnicas',
  softSkills: 'Habilidades blandas',
  code: 'Ejercicios de código',
};

export default function DimensionScoresGrid({ scores = {} }) {
  const entries = Object.entries(labels).filter(([key]) => scores[key] !== null && scores[key] !== undefined);
  if (!entries.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map(([key, label]) => <ScoreCard key={key} label={label} value={scores[key]} />)}
    </div>
  );
}
