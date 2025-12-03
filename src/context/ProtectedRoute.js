import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAuth = true }) => {
	const { isAuthenticated, loading } = useAuth();
	const location = useLocation();

	useEffect(() => {
		if (!loading) {
			if (requireAuth && !isAuthenticated) {
				// Полная перезагрузка на страницу логина
				const currentPath = location.pathname + location.search;
				window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
				return;
			}
			
			if (!requireAuth && isAuthenticated) {
				// Полная перезагрузка на страницу аккаунта
				window.location.href = '/account';
				return;
			}
		}
	}, [loading, isAuthenticated, requireAuth, location]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	// Если дошли сюда - пользователь авторизован/неавторизован соответственно
	return children;
};

export default ProtectedRoute;