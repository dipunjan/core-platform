import { isRouteErrorResponse } from 'react-router-dom';
import { queryError } from '@/api';

type Props = {
  error: unknown;
  homeHref: string;
  homeLabel: string;
};

export function errorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `Request failed (${error.status})`;
  }
  return queryError(error, 'Something broke.');
}

export function ErrorPanel({ error, homeHref, homeLabel }: Props) {
  const message = errorMessage(error);
  const offline = /cannot reach|failed to fetch|network error|err_connection|econnrefused/i.test(
    String(message),
  );

  return (
    <div className="mx-auto px-3 py-5" style={{ maxWidth: '32rem' }}>
      <p className="small fw-semibold text-uppercase text-primary mb-0">
        Shop
      </p>
      <h1 className="h3 fw-semibold mt-2">
        {offline ? 'Cannot reach the API' : 'This page hit a snag'}
      </h1>
      <p className="text-muted small mt-3 mb-0">
        {offline && !message.startsWith('Cannot reach')
          ? 'Start Mongo, RabbitMQ, and the five services (ports 3000–3004), then try again. Health check: curl http://localhost:3000/api/health/live'
          : message}
      </p>
      <div className="d-flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          className="btn btn-dark fw-semibold"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
        <a href={homeHref} className="btn btn-outline-secondary fw-semibold">
          {homeLabel}
        </a>
      </div>
    </div>
  );
}
