import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = useSelector((s) => s.auth.token);
  const location = useLocation();
  // Remember where the visitor was going so Login can send them back there
  return token ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
