import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        checkAuthentication();
    }, [location]);

    const checkAuthentication = async () => {
        setLoading(true);
        
        try {
            // Проверяем авторизацию ТОЛЬКО через сервер
            const result = await AuthService.checkAuth();
            
            if (result.authenticated) {
                // Сохраняем пользователя в localStorage после успешной проверки
                if (result.user) {
                    AuthService.setUser(result.user);
                }
                setLoading(false);
            } else {
                // Неавторизован - редирект на логин
                handleUnauthorized();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            handleUnauthorized();
        }
    };

    const handleUnauthorized = () => {
        AuthService.clearAuthData();
        const currentPath = location.pathname + location.search;
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { 
            replace: true,
            state: { from: location.pathname }
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <span className="text-gray-600">Проверка авторизации...</span>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;