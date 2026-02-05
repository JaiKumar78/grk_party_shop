import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/reduxhooks.js';

const UserProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.userAuth);

  if (!isAuthenticated || user?.role !== 'user') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default UserProtectedRoute;