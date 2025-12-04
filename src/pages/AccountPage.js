import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainContent from '../components/MainContent';
import AuthService from '../services/AuthService';
import '../styles/AccountPage.css';

const AccountPage = () => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
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
		<MainContent>
			<h1 className="account-title">Личный кабинет</h1>
			<div className="account-container">
				<div className="account-card">
					<h2>Информация о пользователе</h2>
					<div className="account-info">
						<p><strong>Email:</strong> {user.email}</p>
						<p><strong>Имя:</strong> {user.name}</p>
						<p><strong>Фамилия:</strong> {user.surname}</p>
						<p><strong>Отчество:</strong> {user.patronymic || 'Не указано'}</p>
					</div>
				</div>
				<button onClick={handleLogout} className="logout-button">
					Выйти
				</button>
			</div>
		</MainContent>
	);
};

export default AccountPage;