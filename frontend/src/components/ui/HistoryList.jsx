import HistoryCard from './HistoryCard.jsx';

export default function HistoryList({ items = [] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => <HistoryCard key={item.interviewId} item={item} />)}
    </div>
  );
}
