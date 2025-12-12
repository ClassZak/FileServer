import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainContent from '../components/MainContent';
import ChangePasswordModal from '../components/ChangePasswordModal';
import AuthService from '../services/AuthService';
import '../styles/AccountPage.css';

function AccountPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthAndLoadUser = async () => {
            try {
                const result = await AuthService.checkAuth();
                
                if (result.authenticated) {
                    setUser(result.user);
                    if (result.user) {
                        AuthService.setUser(result.user);
                    }
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Ошибка проверки авторизации:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndLoadUser();
    }, [navigate]);

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
    };

    const handleUpdatePassword = async (email, authToken, oldPassword, newPassword) => {
		try {
			const result = await AuthService.updatePassword(email, AuthService.getToken(), oldPassword, newPassword);
			
			// AuthService теперь всегда возвращает объект
			return result;
			
		} catch (error) {
			console.error('Error in handleUpdatePassword:', error);
			return {
				success: false,
				message: 'Неизвестная ошибка при изменении пароля'
			};
		}
	};

    const openPasswordModal = () => {
        setIsPasswordModalOpen(true);
    };

    const closePasswordModal = () => {
        setIsPasswordModalOpen(false);
    };

    // Получаем токен из localStorage
    const getAuthToken = () => {
        const token = localStorage.getItem('authToken');
        // Если хранится только токен без 'Bearer '
        if (token && !token.startsWith('Bearer ')) {
            return `Bearer ${token}`;
        }
        return token || '';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div>
		<MainContent>
			<h1 className="account-title">Личный кабинет</h1>
			<div className="account-container">
				<div className="account-card">
					<h2>Информация о пользователе</h2>
					<div className="account-info">
						<p><strong>Email:</strong> {user.email}</p>
						<p><strong>Фамилия:</strong> {user.surname}</p>
						<p><strong>Имя:</strong> {user.name}</p>
						<p><strong>Отчество:</strong> {user.patronymic || 'Не указано'}</p>
					</div>
					<button onClick={setIsPasswordModalOpen} className="logout-button">
						Обновить пароль
					</button>
				</div>
				<button onClick={handleLogout} className="logout-button">
					Выйти
				</button>
			</div>
		</MainContent>

		{/* Модальное окно изменения пароля */}
		<ChangePasswordModal
			isOpen={isPasswordModalOpen}
			onClose={closePasswordModal}
			userEmail={user.email}
			onUpdatePassword={handleUpdatePassword}
			authToken={getAuthToken()}
		/>
        </div>
    );
};

export default AccountPage;