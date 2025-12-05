import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';
import MainContent from '../components/MainContent';
import '../styles/AccountPage.css';
import '../styles/LoginPage.css'

const LoginPage = () => {
    // Состояние для выбора типа входа
    const [loginType, setLoginType] = useState('email');
    
    // Поля для входа по email
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Поля для входа по ФИО
    const [surname, setSurname] = useState('');
    const [name, setName] = useState('');
    const [patronymic, setPatronymic] = useState('');
    const [snpPassword, setSnpPassword] = useState('');
    
    // Общие состояния
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Определяем URL для редиректа после успешного входа
    const from = location.state?.from?.pathname || 
                location.search.replace('?redirect=', '') || 
                '/account';

    // Проверяем существующую авторизацию
    useEffect(() => {
        const checkExistingAuth = async () => {
            if (AuthService.hasToken()) {
                try {
                    const result = await AuthService.checkAuth();
                    if (result.authenticated) {
                        navigate(from, { replace: true });
                    }
                } catch (error) {
                    console.log('Токен недействителен, требуется вход');
                }
            }
        };

        checkExistingAuth();
    }, [navigate, from]);

    // Обработчик входа по email
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        setError('');
        setIsSubmitting(true);
        
        try {
            const result = await AuthService.loginByEmail(email, password);
            
            if (result.success) {
                // Проверяем авторизацию через сервер
                const authResult = await AuthService.checkAuth();
                
                if (authResult.authenticated) {
                    navigate(from, { replace: true });
                } else {
                    setError('Ошибка авторизации после входа');
                }
            } else {
                setError(result.message || 'Ошибка входа');
            }
        } catch (err) {
            console.error('Login failed:', err);
            setError('Ошибка сети или сервера');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Обработчик входа по ФИО
    const handleSnpLogin = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        setError('');
        setIsSubmitting(true);
        
        try {
            const result = await AuthService.loginBySnp(surname, name, patronymic, snpPassword);
            
            if (result.success) {
                // Проверяем авторизацию через сервер
                const authResult = await AuthService.checkAuth();
                
                if (authResult.authenticated) {
                    navigate(from, { replace: true });
                } else {
                    setError('Ошибка авторизации после входа');
                }
            } else {
                setError(result.message || 'Ошибка входа');
            }
        } catch (err) {
            console.error('Login by SNP failed:', err);
            setError('Ошибка сети или сервера');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Сброс полей при переключении типа входа
    const switchLoginType = (type) => {
        setLoginType(type);
        setError('');
        // Сбрасываем пароли при переключении
        setPassword('');
        setSnpPassword('');
    };

    return (
        <MainContent>
            <div className="login-container">
                <div className="login-wrapper">
                    <div className="login-card">
                        <h1 className="login-title">Авторизация</h1>
                        
                        {/* Переключатель типа входа */}
                        <div className="auth-switcher">
                            <button
                                type="button"
                                className={loginType === 'email' ? 'active' : ''}
                                onClick={() => switchLoginType('email')}
                                disabled={isSubmitting}
                            >
                                По Email
                            </button>
                            <button
                                type="button"
                                className={loginType === 'snp' ? 'active' : ''}
                                onClick={() => switchLoginType('snp')}
                                disabled={isSubmitting}
                            >
                                По ФИО
                            </button>
                        </div>

                        {/* Сообщения об ошибках */}
                        {error && (
                            <div className="auth-error">
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Форма для входа по Email */}
                        {loginType === 'email' && (
                            <form className="auth-form" onSubmit={handleEmailLogin}>
                                <div className="auth-form-group">
                                    <label htmlFor="email">Email адрес</label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="example@mail.ru"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                
                                <div className="auth-form-group">
                                    <label htmlFor="password">Пароль</label>
                                    <div className="password-container">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            placeholder="Введите пароль"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isSubmitting}
                                        >
                                            {showPassword ? 'Скрыть' : 'Показать'}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="auth-submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="auth-spinner"></span>
                                            Вход...
                                        </>
                                    ) : (
                                        'Войти через Email'
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Форма для входа по ФИО */}
                        {loginType === 'snp' && (
                            <form className="auth-form" onSubmit={handleSnpLogin}>
                                <div className="snp-grid">
                                    <div className="auth-form-group">
                                        <label htmlFor="surname">Фамилия</label>
                                        <input
                                            id="surname"
                                            type="text"
                                            required
                                            placeholder="Иванов"
                                            value={surname}
                                            onChange={(e) => setSurname(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    
                                    <div className="auth-form-group">
                                        <label htmlFor="name">Имя</label>
                                        <input
                                            id="name"
                                            type="text"
                                            required
                                            placeholder="Иван"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    
                                    <div className="auth-form-group">
                                        <label htmlFor="patronymic">Отчество</label>
                                        <input
                                            id="patronymic"
                                            type="text"
                                            required
                                            placeholder="Иванович"
                                            value={patronymic}
                                            onChange={(e) => setPatronymic(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                                
                                <div className="auth-form-group">
                                    <label htmlFor="snpPassword">Пароль</label>
                                    <div className="password-container">
                                        <input
                                            id="snpPassword"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            placeholder="Введите пароль"
                                            value={snpPassword}
                                            onChange={(e) => setSnpPassword(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isSubmitting}
                                        >
                                            {showPassword ? 'Скрыть' : 'Показать'}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="auth-submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="auth-spinner"></span>
                                            Вход...
                                        </>
                                    ) : (
                                        'Войти по ФИО'
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Дополнительная информация */}
                        <div className="auth-info">
                            <p>Для входа используйте email или ФИО с паролем</p>
                            <p>Все запросы проверяются через сервер</p>
                        </div>
                    </div>
                </div>
            </div>
        </MainContent>
    );
};

export default LoginPage;