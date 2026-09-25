import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function AdminProtectedRoute({ children }) {
  const token = useSelector((s) => s.adminAuth.token);
  return token ? children : <Navigate to="/admin/login" replace />;
}
