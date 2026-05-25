import Badge, { statusTone } from './Badge.jsx';

export default function StatusBadge({ status, fallback = 'PENDING' }) {
  const value = status || fallback;
  return <Badge tone={statusTone(value)}>{value}</Badge>;
}
