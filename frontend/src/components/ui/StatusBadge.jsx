import Badge, { statusTone } from './Badge.jsx';
import { formatStatus } from '../../utils/formatters.js';

export default function StatusBadge({ status, fallback = 'PENDING' }) {
  const value = status || fallback;
  return <Badge tone={statusTone(value)}>{formatStatus(value, fallback)}</Badge>;
}
