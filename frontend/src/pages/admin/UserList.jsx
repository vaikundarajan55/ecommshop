import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUserStatus } from '../../store/slices/admin/userSlice';
import { notify } from '../../utils/notify';
import DataTable from '../../components/admin/common/DataTable';
import ActionButton, { ActionGroup } from '../../components/admin/common/ActionButton';

export default function UserList() {
  const dispatch = useDispatch();
  const { items: users, filters: lastFilters } = useSelector((state) => state.users);
  const [filters, setFilters] = useState(lastFilters);

  const load = () => dispatch(fetchUsers(filters)).unwrap().catch(notify.error);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStatus = async (row) => {
    const newStatus = row.status === 'active' ? 'blocked' : 'active';
    try {
      await dispatch(updateUserStatus({ id: row.id, status: newStatus })).unwrap();
      notify.updated(`User ${newStatus}`);
    } catch (message) {
      notify.error(message);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-gray-800">User List</h2>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-white p-4 shadow-sm">
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <input placeholder="Search name/email" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Search</button>
      </form>

      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'status', label: 'Status' },
        ]}
        rows={users}
        renderActions={(row) => (
          <ActionGroup>
            <ActionButton
              type={row.status === 'active' ? 'block' : 'activate'}
              label={row.status === 'active' ? 'Block user' : 'Activate user'}
              onClick={() => toggleStatus(row)}
            />
          </ActionGroup>
        )}
      />
    </div>
  );
}
