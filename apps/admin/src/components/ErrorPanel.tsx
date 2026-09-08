import { isRouteErrorResponse } from 'react-router-dom';

type Props = {
  error: unknown;
  homeHref: string;
  homeLabel: string;
};

export function errorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `Request failed (${error.status})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something broke.';
}

export function ErrorPanel({ error, homeHref, homeLabel }: Props) {
  const message = errorMessage(error);
  const offline = /failed to fetch|network error|err_connection|econnrefused/i.test(
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
        {offline
          ? 'Start the APIs (user-service on 3000, product-service on 3001, …), then try again.'
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
