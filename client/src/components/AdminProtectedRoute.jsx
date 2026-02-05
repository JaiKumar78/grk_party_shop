import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/reduxhooks.js';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, admin } = useAppSelector((state) => state.adminAuth);


  if (!isAuthenticated || admin?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;