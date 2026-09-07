import { useRouteError } from 'react-router-dom';
import { ErrorPanel } from './ErrorPanel';

export function RouteError() {
  return (
    <ErrorPanel
      error={useRouteError()}
      homeHref="/"
      homeLabel="Back to sales"
    />
  );
}
