import { formatScore } from '../../utils/formatters.js';
import Card, { CardBody } from './Card.jsx';

export default function ScoreCard({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{formatScore(value)}</p>
      </CardBody>
    </Card>
  );
}
