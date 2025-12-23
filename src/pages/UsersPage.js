import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import MainContent from "../components/MainContent";
import CreateUserModal from '../components/modal/user/CreateUserModal';

import AuthService from '../services/AuthService';
import AdminService from '../services/AdminService';
import UserService from "../services/UserService";


import LoadingSpinner from '../components/LoadingSpinner'


import '../styles/FileTable.css';




function UsersPage() {
	const [showCreateUserModal, setShowCreateUserModal] = useState(false);
	const [users, setUsers] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const checkAuth = async () => {
		try {
			const isAdminResponse = await AdminService.isAdmin(AuthService.getToken());
			if (!isAdminResponse?.isAdmin) {
				navigate(`/account`);
				return false;
			}
			return true;
		} catch (error) {
			console.error('Ошибка проверки прав:', error);
			setError('Ошибка проверки прав доступа');
			return false;
		}
	};

	const loadUsers = async () => {
		try {
			setIsLoading(true);
			const token = AuthService.getToken();
			const response = await UserService.readAllUsers(token);
			
			if (response.error) {
				setError(response.error);
				setUsers([]);
			} else if (response.users) {
				setUsers(response.users);
			} else {
				setUsers([]);
			}
		} catch (error) {
			console.error('Ошибка при загрузке пользователей:', error);
			setError('Не удалось загрузить список пользователей');
			setUsers([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const init = async () => {
			const isAdmin = await checkAuth();
			if (isAdmin) {
				await loadUsers();
			}
		};
		init();
	}, []);

	const navigateToUser = (email) => {
		navigate(`/user/${encodeURIComponent(email)}`);
	};

	const UserRow = ({ user }) => {
		return (
			<tr key={`user-${user.email}`}>
				<td>{user.surname}</td>
				<td>{user.name}</td>
				<td>{user.patronymic}</td>
				<td>{user.email}</td>
				<td>{user.createdAt}</td>
				<td>
					<button
						onClick={() => navigateToUser(user.email)}
						style={{ cursor: 'pointer', padding: '8px 16px' }}
					>
						Изменить данные
					</button>
				</td>
			</tr>
		);
	};

	const UserTable = ({ users }) => {
		return (
			<table className='file-table'>
				<thead>
					<tr>
						<th>Фамилия</th>
						<th>Имя</th>
						<th>Отчество</th>
						<th>Почта</th>
						<th>Дата создания</th>
						<th>Действия</th>
					</tr>
				</thead>
				<tbody>
					{users && users.length > 0 ? (
						users.map(user => <UserRow key={user.email} user={user} />)
					) : (
						<tr>
							<td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
								Пользователи не найдены
							</td>
						</tr>
					)}
				</tbody>
			</table>
		);
	};
	
	const onConfirmCreateUser = async (user) => {
		try {
			const token = AuthService.getToken();
			const response = await UserService.createUser(user, token);

			if (response.error) {
				setError(response.error);
			} else if (!response.success) {
				setError('Не удалось создать нового пользователя');
			} else {
				// Обновляем список пользователей после успешного создания
				await loadUsers();
			}
			
			setShowCreateUserModal(false);
		} catch (error) {
			console.error('Ошибка при создании пользователя:', error);
			setError('Произошла ошибка при создании пользователя');
		}
	};

	return (
		<>
			<MainContent>
				{isLoading ? (
					<LoadingSpinner title={'Загрузка пользователей'}/>
				) : error ? (
					<div style={{
						padding: '20px',
						textAlign: 'center',
						backgroundColor: '#ffe6e6',
						border: '1px solid #ff9999',
						borderRadius: '8px',
						margin: '20px 0'
					}}>
						<p style={{ color: '#cc0000', marginBottom: '15px' }}>{error}</p>
						<button 
							onClick={loadUsers}
							style={{
								padding: '8px 16px',
								backgroundColor: '#cc0000',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer'
							}}
						>
							Повторить попытку
						</button>
					</div>
				) : (
					<div>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
							<h1>Пользователи</h1>
							<button 
								onClick={() => setShowCreateUserModal(true)}
								style={{ padding: '10px 20px', cursor: 'pointer' }}
								>
								Создать пользователя
							</button>
						</div>
						<UserTable users={users} />
					</div>
				)}
			</MainContent>
			
			<CreateUserModal
				isOpen={showCreateUserModal}
				onClose={() => { setShowCreateUserModal(false); setError(''); }}
				onConfirm={onConfirmCreateUser}
				error={error}
			/>
		</>
	);
}

export default UsersPage;
