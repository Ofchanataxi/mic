import Badge from './Badge.jsx';
import { formatSkillType } from '../../utils/formatters.js';

export default function TopicBadge({ topic }) {
  return (
    <div className="rounded-md border border-slate-100 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-950">{topic.name}</h3>
        <Badge tone={topic.skillType === 'TECHNICAL' ? 'info' : 'default'}>{formatSkillType(topic.skillType)}</Badge>
        {topic.expectedLevel ? <Badge tone="warning">{topic.expectedLevel}</Badge> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(topic.subtopics || []).map((subtopic) => (
          <span key={subtopic.id || subtopic.name} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            {subtopic.name}
          </span>
        ))}
      </div>
    </div>
  );
}
