import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';
import Header from '../parts/Header';
import MainContent from '../components/MainContent';
import Footer from '../parts/Footer';
import api from '../services/api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from || '/account';

    useEffect(() => {
        // Если уже авторизован, перенаправляем
        if (AuthService.isAuthenticated()) {
            navigate(from, { replace: true });
        }
    }, [navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Отключаем дефолтное поведение формы
        
        if (isSubmitting) return;
        
        setError('');
        setIsSubmitting(true);
        
        try {
            // Отправляем запрос через прокси на Spring сервер
            const response = await api.post('/api/auth/login', {
                email,
                password
            });
            
            const { token, user } = response.data;
            
            // Сохраняем токен
            localStorage.setItem('token', token);
            if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            
            // Обновляем состояние аутентификации
            AuthService.setToken(token);
            
            // Редирект на защищенную страницу
            navigate(from, { replace: true });
            
        } catch (err) {
            console.error('Login failed:', err);
            
            // Обрабатываем разные типы ошибок
            if (err.response) {
                // Сервер ответил с кодом ошибки
                const status = err.response.status;
                if (status === 401 || status === 403) {
                    setError('Неверный email или пароль');
                } else if (status === 404) {
                    setError('Сервер авторизации недоступен');
                } else if (status >= 500) {
                    setError('Ошибка сервера. Попробуйте позже');
                } else {
                    setError(err.response.data?.message || 'Ошибка входа');
                }
            } else if (err.request) {
                // Запрос был сделан, но ответа нет
                setError('Сервер не отвечает. Проверьте подключение');
            } else {
                // Ошибка при настройке запроса
                setError('Ошибка при отправке запроса');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (AuthService.isAuthenticated()) {
        return null;
    }

    return (
        <div>
            <Header />
            <MainContent>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
                        <h2 className="text-3xl font-bold text-center">Авторизация</h2>
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Пароль
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Вход...' : 'Войти'}
                            </button>
                        </form>
                    </div>
                </div>
            </MainContent>
            <Footer />
        </div>
    );
};

export default LoginPage;