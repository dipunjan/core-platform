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
  const offline = /can't connect|can't load|failed to fetch|network error|err_connection|econnrefused/i.test(
    String(message),
  );

  return (
    <div className="container py-5" style={{ maxWidth: '32rem' }}>
      <p className="small fw-semibold text-uppercase text-success">
        Admin
      </p>
      <h1 className="h2 mt-2">
        {offline ? 'Cannot reach the API' : 'This page hit a snag'}
      </h1>
      <p className="mt-3 text-muted">
        {offline && !/can't (connect|load)/i.test(message)
          ? "Can't connect to the shop right now. Make sure everything is running, then try again."
          : message}
      </p>
      <div className="mt-4 d-flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-dark"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
        <a href={homeHref} className="btn btn-outline-secondary">
          {homeLabel}
        </a>
      </div>
    </div>
  );
}
