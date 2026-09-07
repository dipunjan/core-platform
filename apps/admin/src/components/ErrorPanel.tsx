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
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
        swoop admin
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
        {offline ? 'Cannot reach the API' : 'This page hit a snag'}
      </h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        {offline
          ? 'Start the APIs (user-service on 3000, product-service on 3001, …), then try again.'
          : message}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
        <a
          href={homeHref}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
        >
          {homeLabel}
        </a>
      </div>
    </div>
  );
}
