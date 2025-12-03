import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Простая проверка - если есть токен, считаем авторизованным
        // В реальном приложении можно добавить проверку с бэкендом
        if (!AuthService.isAuthenticated()) {
            const currentPath = location.pathname + location.search;
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            return;
        }
        setLoading(false);
    }, [location]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;