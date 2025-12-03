import { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Инициализация - проверяем авторизацию через сервер
    useEffect(() => {
        initAuth();
    }, []);

    const initAuth = async () => {
        try {
            // Проверяем только через сервер
            const result = await AuthService.checkAuth();
            
            if (result.authenticated) {
                setAuthenticated(true);
                setUser(result.user);
                if (result.user) {
                    AuthService.setUser(result.user);
                }
            } else {
                // Если не авторизован, очищаем состояние
                setAuthenticated(false);
                setUser(null);
                AuthService.clearAuthData();
            }
        } catch (error) {
            console.error('Initial auth check error:', error);
            setAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        try {
            const result = await AuthService.loginByEmail(email, password);
            
            if (result.success) {
                // После успешного логина проверяем авторизацию через сервер
                const authResult = await AuthService.checkAuth();
                
                if (authResult.authenticated) {
                    setAuthenticated(true);
                    setUser(authResult.user);
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        message: 'Ошибка проверки авторизации после входа' 
                    };
                }
            } else {
                return { 
                    success: false, 
                    message: result.message 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: 'Ошибка сети' 
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        AuthService.logout();
        setAuthenticated(false);
        setUser(null);
        window.href='/login';
    };

    const checkAuth = async () => {
        const result = await AuthService.checkAuth();
        if (!result.authenticated) {
            logout();
        } else if (result.user) {
            setUser(result.user);
            AuthService.setUser(result.user);
        }
        return result;
    };

    const value = {
        user,
        authenticated,
        loading,
        login,
        logout,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};