import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { feedbackApi } from '../../api/feedbackApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import HistoryList from '../../components/ui/HistoryList.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await feedbackApi.getMyHistory();
      setItems(data.items || []);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <>
      <PageHeader
        eyebrow="Historial"
        title="Entrevistas"
        description="Consulta entrevistas terminadas, estado de procesamiento, feedback disponible y score global cuando exista."
        action={<Button variant="secondary" onClick={loadHistory}>Actualizar</Button>}
      />

      {loading ? <LoadingState label="Cargando historial" /> : null}
      {error ? <div className="mb-5"><Alert tone="error">{error}</Alert></div> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin entrevistas"
          description="Crea una entrevista para empezar a construir tu historial."
          action={<Link className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700" to="/interviews/new">Nueva entrevista</Link>}
        />
      ) : null}

      {!loading && items.length > 0 ? <HistoryList items={items} /> : null}
    </>
  );
}
