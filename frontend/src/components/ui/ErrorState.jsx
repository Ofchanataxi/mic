import Alert from './Alert.jsx';
import Button from './Button.jsx';

export default function ErrorState({ title = 'Algo salió mal', message, onRetry }) {
  return (
    <Alert tone="error" title={title}>
      <div className="space-y-3">
        <p>{message}</p>
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
