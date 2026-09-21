import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, SIGNIN_FOR_ROLE } from '../context/AuthContext';
import Forbidden from '../pages/Forbidden';
import FullPageLoader from './FullPageLoader';

/**
 * Guards a branch of the route tree. While the stored token is being checked
 * it renders a loader rather than redirecting, so a refresh does not throw a
 * signed-in user back to the sign-in screen.
 */
const ProtectedRoute = ({ role }) => {
  const { isAuthenticated, isLoading, role: currentRole } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={SIGNIN_FOR_ROLE[role] || '/choose'}
        replace
        state={{ from: location }}
      />
    );
  }

  if (role && currentRole !== role) return <Forbidden />;

  return <Outlet />;
};

export default ProtectedRoute;
