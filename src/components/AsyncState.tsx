import { ApiError } from '../api/errors';
import type { ReactNode } from 'react';

export function AsyncState({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty?: boolean;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="card card-pad" role="status">
        Loading…
      </div>
    );
  if (error) {
    const code = error instanceof ApiError ? error.code : 'REQUEST_FAILED';
    return (
      <div className="card card-pad" role="alert">
        Unable to load this data. <small>{code}</small>
      </div>
    );
  }
  if (empty) return <div className="card card-pad">No records found.</div>;
  return <>{children}</>;
}
