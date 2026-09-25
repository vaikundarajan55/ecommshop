import { useState } from 'react';
import { notify } from '../../utils/notify';
import api from '../../services/adminApi';

export default function ChangePassword() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return notify.error('Passwords do not match');
    try {
      await api.post('/auth/change-password', form);
      notify.updated('Password changed successfully');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-5 shadow-sm">
        <input type="password" placeholder="Current Password" required value={form.oldPassword}
          onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input type="password" placeholder="New Password" required value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input type="password" placeholder="Confirm New Password" required value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <button className="w-full rounded-md bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          Update Password
        </button>
      </form>
    </div>
  );
}
