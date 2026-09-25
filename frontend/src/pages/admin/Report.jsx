import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderReport } from '../../store/slices/admin/reportSlice';
import { notify } from '../../utils/notify';
import DataTable from '../../components/admin/common/DataTable';

export default function Report() {
  const dispatch = useDispatch();
  const { rows, loading } = useSelector((state) => state.report);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', status: '', groupBy: 'day' });

  const runReport = (e) => {
    e.preventDefault();
    dispatch(fetchOrderReport(filters)).unwrap().catch(notify.error);
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Order Report</h2>
      <form onSubmit={runReport} className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5 sm:[&>button]:col-span-2 lg:[&>button]:col-span-1">
        <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending">Pending</option>
        </select>
        <select value={filters.groupBy} onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="day">Group by Day</option>
          <option value="status">Group by Status</option>
          <option value="payment_method">Group by Payment Method</option>
        </select>
        <button disabled={loading} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">Run Report</button>
      </form>

      <DataTable
        columns={[
          { key: 'group_label', label: 'Group' },
          { key: 'total_orders', label: 'Total Orders' },
          { key: 'total_revenue', label: 'Total Revenue' },
        ]}
        rows={rows}
      />
    </div>
  );
}
