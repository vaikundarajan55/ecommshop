import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

// Admin theme gradient (--cp-gradient in index.css), same as the sidebar
const HEADER_BG = 'cp-gradient-bg animate-gradient motion-reduce:animate-none';

export default function DataTable({ columns, rows, renderActions, pageSize = 8, emptyText = 'No records found' }) {
  const [page, setPage] = useState(1);
  // 1 = moved forward, -1 = moved back, 0 = first render / new data -> picks the row entrance animation
  const [dir, setDir] = useState(0);

  // Reset to first page whenever the underlying data set changes (new filter/search results)
  useEffect(() => { setPage(1); setDir(0); }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize]
  );

  const goTo = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next === currentPage) return;
    setDir(next > currentPage ? 1 : -1);
    setPage(next);
  };
  const rowAnim = dir > 0 ? 'animate-slideInRight' : dir < 0 ? 'animate-slideInLeft' : 'animate-rowIn';

  const empty = (
    <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
      <span className="flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 text-sky-600 motion-reduce:animate-none">
        <Inbox size={26} />
      </span>
      <span className="text-sm">{emptyText}</span>
    </div>
  );

  return (
    <div className="animate-fadeInUp overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm transition-shadow duration-300 hover:[box-shadow:var(--cp-gradient-shadow)]">
      {/* Desktop / tablet table view */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-sky-100 text-sm">
          <thead className={HEADER_BG}>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className="animate-fadeInDown whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {col.label}
                </th>
              ))}
              {renderActions && (
                <th className="animate-fadeInDown px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white" style={{ animationDelay: `${columns.length * 50}ms` }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody key={currentPage} className="divide-y divide-sky-50">
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1}>{empty}</td>
              </tr>
            )}
            {pagedRows.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className={`${rowAnim} group transition-colors duration-200 odd:bg-white even:bg-sky-50/40 hover:bg-gradient-to-r hover:from-sky-50 hover:via-cyan-50/70 hover:to-transparent`}
                style={{ animationDelay: `${idx * 45}ms` }}
              >
                {columns.map((col, c) => (
                  <td
                    key={col.key}
                    // First cell carries a blue accent bar that grows in on hover
                    className={`px-4 py-3 text-gray-700 transition-all duration-200 ${
                      c === 0 ? 'shadow-[inset_0_0_0_0_#0284c7] group-hover:shadow-[inset_4px_0_0_0_#0284c7]' : ''
                    }`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {renderActions && <td className="px-4 py-3">{renderActions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div key={currentPage} className="divide-y divide-sky-50 md:hidden">
        <div className={`h-1.5 ${HEADER_BG}`} />
        {pagedRows.length === 0 && empty}
        {pagedRows.map((row, idx) => (
          <div
            key={row.id ?? idx}
            className={`${rowAnim} space-y-1.5 border-l-4 border-transparent p-4 transition-all duration-200 hover:border-sky-500 hover:bg-gradient-to-r hover:from-sky-50 hover:to-transparent active:bg-sky-50/60`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                <span className="shrink-0 font-medium text-gray-500">{col.label}</span>
                <span className="text-right text-gray-700">{col.render ? col.render(row) : row[col.key]}</span>
              </div>
            ))}
            {renderActions && (
              <div className="flex justify-end gap-2 pt-1">{renderActions(row)}</div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 bg-gradient-to-r from-blue-50/70 via-white to-cyan-50/70 px-4 py-3 text-sm">
          <span key={currentPage} className="animate-fadeIn text-gray-500">
            Showing <span className="font-medium text-gray-700">{(currentPage - 1) * pageSize + 1}</span>–
            <span className="font-medium text-gray-700">{Math.min(currentPage * pageSize, rows.length)}</span> of{' '}
            <span className="font-medium text-gray-700">{rows.length}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-all duration-150 hover:bg-sky-100 hover:text-sky-700 active:scale-90 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('...' + p);
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                typeof p === 'string' ? (
                  <span key={`gap-${i}`} className="px-1 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goTo(p)}
                    aria-current={p === currentPage ? 'page' : undefined}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-all duration-200 ${
                      p === currentPage
                        ? 'animate-pop cp-gradient text-white'
                        : 'text-gray-600 hover:-translate-y-0.5 hover:bg-sky-100 hover:text-sky-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-all duration-150 hover:bg-sky-100 hover:text-sky-700 active:scale-90 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
