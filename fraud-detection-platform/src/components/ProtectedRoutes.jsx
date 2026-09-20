import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const savedToken = token || localStorage.getItem('token');

  if (!savedToken) {
    console.log('[PROTECTED ROUTE] No token found. Redirecting to login.');
    return <Navigate to="/" replace />;
  }
  return children;
}

export function AdminRoute({ children }) {
  const { token, user } = useAuth();
  const savedToken = token || localStorage.getItem('token');
  
  let savedUser = user;
  if (!savedUser) {
    try {
      const raw = localStorage.getItem('user');
      if (raw) savedUser = JSON.parse(raw);
    } catch (e) {
      savedUser = null;
    }
  }

  if (!savedToken) {
    console.log('[ADMIN ROUTE] No token found. Redirecting to login.');
    return <Navigate to="/" replace />;
  }

  const role = (savedUser?.role || '').toLowerCase();
  if (role !== 'admin') {
    console.log(`[ADMIN ROUTE DENIED] User role '${role}' is not admin. Redirecting to /user/dashboard.`);
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
}
