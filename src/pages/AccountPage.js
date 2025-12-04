import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainContent from "../components/MainContent";
import AuthService from "../services/AuthService";
import '../styles/AccountPage.css'

const AccountPage = () => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		// При загрузке страницы проверяем авторизацию через сервер
		const checkAuthAndLoadUser = async () => {
			try {
				const result = await AuthService.checkAuth();
				
				if (result.authenticated) {
					setUser(result.user);
					if (result.user) {
						AuthService.setUser(result.user);
					}
				} else {
					// Если не авторизован - редирект на логин
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
		navigate('/login')
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (!user) {
		return null; // Редирект уже должен был произойти
	}

	return (
		<MainContent>
			<div className="min-h-screen bg-gray-100 py-12 px-4">
				<h1 className="text-3xl font-bold mb-6">Личный кабинет</h1>
				<div className="bg-white rounded-lg shadow p-6">
					<div className="mb-4">
						<h2 className="text-xl font-semibold">Информация о пользователе</h2>
						<p className="text-gray-600">Email: {user.email}</p>
						<p className="text-gray-600">Имя: {user.name}</p>
						<p className="text-gray-600">Фамилия: {user.surname}</p>
						<p className="text-gray-600">Отчество: {user.patronymic || 'Не указано'}</p>
					</div>
					
					<button
						onClick={handleLogout}
						className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
					>
						Выйти
					</button>
				</div>
			</div>
		</MainContent>
	);
};

export default AccountPage;