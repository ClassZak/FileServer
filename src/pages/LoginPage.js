import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../parts/Header';
import MainContent from '../components/MainContent';
import Footer from '../parts/Footer';


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, isAuthenticated } = useAuth();
	console.log(`login:${login}`);
	console.log(`isAuthenticated:${isAuthenticated}`);
	console.log(`useAuth:${useAuth()}`);
    const navigate = useNavigate();
    const location = useLocation();


    const from = location.state?.from || '/account';

    useEffect(() => {
        // Если уже авторизован, перенаправляем
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        setError('');
        setIsSubmitting(true);
        
        try {
            // ✅ Теперь login доступна как функция!
            const result = await login(email, password);
            
            if (result.success) {
                navigate(from, { replace: true });
            } else {
                setError(result.message || 'Ошибка входа');
            }
        } catch (err) {
            setError('Произошла непредвиденная ошибка');
            console.error('Login error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAuthenticated) {
        return null; // Или индикатор загрузки
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