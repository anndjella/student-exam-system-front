import { useMemo } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function DataTablePage({
  title,
  subtitle,
  queryPlaceholder = "Search...",
  query,
  setQuery,

  loading,
  error,

  items,
  total,
  take,
  setTake,
  skip,
  page,
  pageCount,
  canPrev,
  canNext,
  goPrev,
  goNext,
  reload,

  columns,
  rowKey,
  renderRowCells,

  actions,
}) {
  const showingFrom = useMemo(() => (total === 0 ? 0 : skip + 1), [skip, total]);
  const showingTo = useMemo(() => clamp(skip + items.length, 0, total), [skip, items.length, total]);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <div className="page-subtitle">{subtitle}</div>}
        </div>

        <div className="row gap-10">
          <button className="btn" onClick={reload} disabled={loading}>
            Refresh
          </button>
          {actions}
        </div>
      </div>

      {error && <div className="alert-error mb-12">{error}</div>}

      <div className="card dt-toolbar">
        <div className="dt-toolbar__row">
          <div className="dt-search">
            <input
              className="input dt-search__input"
              placeholder={queryPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="btn dt-search__clear"
                onClick={() => setQuery("")}
                disabled={loading}
                aria-label="Clear search"
                title="Clear"
              >
                ×
              </button>
            )}
          </div>

          <div className="dt-controls">
            <button className="btn" onClick={goPrev} disabled={!canPrev || loading}>
              Prev
            </button>
            <button className="btn" onClick={goNext} disabled={!canNext || loading}>
              Next
            </button>

            <div className="dt-pagesize">
              <span className="dt-pagesize__label">Page size:</span>
              <select
                className="input dt-pagesize__select"
                value={take}
                onChange={(e) => setTake(Number(e.target.value))}
                disabled={loading}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        <div className="page-subtitle mt-8">
          Showing <span className="mono">{showingFrom}</span>-<span className="mono">{showingTo}</span> of{" "}
          <span className="mono">{total}</span> (page <span className="mono">{page}</span>/
          <span className="mono">{pageCount}</span>)
        </div>
      </div>

      <div className="card dt-tablecard">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={c.className}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="cell-loading">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="cell-loading">
                    No results.
                  </td>
                </tr>
              ) : (
                items.map((it, i) => (
                  <tr key={rowKey(it, i)}>{renderRowCells(it, i)}</tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dt-footer">
          <button className="btn" onClick={goPrev} disabled={!canPrev || loading}>
            Prev
          </button>
          <button className="btn" onClick={goNext} disabled={!canNext || loading}>
            Next
          </button>
          <span className="badge">
            Page <span className="mono">{page}</span>/<span className="mono">{pageCount}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
