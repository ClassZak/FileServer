import MainContent from "../components/MainContent";
import Footer from "../parts/Footer";
import Header from "../parts/Header";




import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AccountPage = () => {
	const { user, logout } = useAuth();
	const [accountData, setAccountData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchAccountData = async () => {
			try {
				const { data } = await axios.get('/api/users/me');
				setAccountData(data);
			} catch (error) {
				console.error('Ошибка загрузки данных:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchAccountData();
	}, []);

	if (loading) {
		return <div>Загрузка...</div>;
	}

	return (
	<div>
		<Header />
			<MainContent>
				<div className="min-h-screen bg-gray-100 py-12 px-4">
					<div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
						<div className="flex justify-between items-center mb-8">
							<h1 className="text-3xl font-bold">Мой аккаунт</h1>
							<button
								onClick={logout}
								className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
							>
								Выйти
							</button>
						</div>
						
						{user && (
							<div className="mb-8">
								<h2 className="text-xl font-semibold mb-4">Информация о пользователе</h2>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-gray-600">Имя:</p>
										<p className="font-medium">{user.name}</p>
									</div>
									<div>
										<p className="text-gray-600">Фамилия:</p>
										<p className="font-medium">{user.surname}</p>
									</div>
									<div>
										<p className="text-gray-600">Email:</p>
										<p className="font-medium">{user.email}</p>
									</div>
									<div>
										<p className="text-gray-600">Дата регистрации:</p>
										<p className="font-medium">{user.createdAt}</p>
									</div>
								</div>
							</div>
						)}
						
						{accountData && (
							<div>
								<h2 className="text-xl font-semibold mb-4">Дополнительные данные</h2>
								{/* Отобразите дополнительные данные с бэкенда */}
							</div>
						)}
					</div>
				</div>
			</MainContent>
			<Footer />
		</div>
	);
};

export default AccountPage;