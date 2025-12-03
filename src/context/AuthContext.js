import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);


/*
export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [token, setToken] = useState(localStorage.getItem('token'));

	// Функция логина
	const login = async (email, password) => {
		try {
			const { data } = await axios.post('/api/auth/login', { email, password });
			localStorage.setItem('token', data.token);
			localStorage.setItem('refreshToken', data.refreshToken);
			setToken(data.token);
			setUser(data.user);
			return { success: true };
		} catch (error) {
			return { 
				success: false, 
				message: error.response?.data?.message || 'Ошибка входа' 
			};
		}
	};

	const logout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('refreshToken');
		setToken(null);
		setUser(null);
		axios.post('/api/auth/logout');
	};

	// Настройка Axios interceptors
	useEffect(() => {
		// Request interceptor
		const requestInterceptor = axios.interceptors.request.use(
			(config) => {
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error) => Promise.reject(error)
		);

		// Response interceptor
		const responseInterceptor = axios.interceptors.response.use(
			(response) => response,
			async (error) => {
				if (error.response?.status === 401) {
					// Получаем текущий URL для редиректа
					const currentPath = window.location.pathname + window.location.search;
					
					// Полная перезагрузка страницы на /login
					window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
				}
				return Promise.reject(error);
			}
		);

		return () => {
			axios.interceptors.request.eject(requestInterceptor);
			axios.interceptors.response.eject(responseInterceptor);
		};
	}, [token]);

	// Проверяем токен при загрузке
	useEffect(() => {
		const verifyToken = async () => {
			if (token) {
				try {
					const { data } = await axios.get('/api/auth/verify', {
						headers: { Authorization: `Bearer ${token}` }
					});
					setUser(data.user);
				} catch (error) {
					localStorage.removeItem('token');
					setToken(null);
				}
			}
			setLoading(false);
		};
		
		verifyToken();
	}, [token]);

	const value = {
		user,
		loading,
		login,        // ✅ Теперь login доступна!
		logout,
		isAuthenticated: !!token
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
};*/


export const AuthProvider = ({ children }) => {
    const login = async (email, password) => {
        console.log('Login called with:', email);
        return { success: true };
    };
    
    const value = { login, isAuthenticated: false };
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};