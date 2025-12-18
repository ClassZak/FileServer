import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import MainContent from "../components/MainContent";
import AuthService from '../services/AuthService';
import AdminService from '../services/AdminService';
import UserService from "../services/UserService";

import User from "../entity/User";
import UserModelAdminResponse from '../entity/UserModelAdminResponse';
import UpdatePasswordRequest from '../entity/UpdatePasswordRequest';

import UpdateUserModal from '../components/modal/user/UpdateUserModal';
import UpdateUserPasswordModal from '../components/modal/user/UpdateUserPasswordModal';
import DeleteUserModal from '../components/modal/user/DeleteUserModal';


import LoadingSpinner from '../components/LoadingSpinner';


import '../styles/AccountPage.css';




function UserPage(){
	const { '*': pathParam } = useParams();
	const [showUpdateUserModal, setShowUpdateUserModal] = useState(false);
	const [showUpdateUserPasswordModal, setShowUpdateUserPasswordModal] = useState(false);
	const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [user, setUser] = useState({});
	const navigate = useNavigate();


	const currentUserEmail = pathParam || '';

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

	const loadUser = async () => {
		try {
			setIsLoading(true);
			const response = await UserService.readUser(
				AuthService.getToken(), currentUserEmail
			);
			
			if (response.error) {
				setError(response.error);
				setUser({});
			} else if (response.user) {
				setUser(response.user);
			} else {
				setUser({});
			}
		} catch (error) {
			console.error('Ошибка при загрузке пользователя:', error);
			setError('Не удалось загрузить данные пользователя');
			setUser({});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const init = async () => {
			if (currentUserEmail === '')
				navigate('/users');

			const isAdmin = await checkAuth();
			if (isAdmin) {
				await loadUser();
			}
		};
		init();
	}, []);

	const onConfirmUpdateUser = async (user) => {
		try {
			const token = AuthService.getToken();
			const response = await UserService.updateUser(token, currentUserEmail, user);

			if (response.error) {
				setError(response.error);
			} else if (!response.success) {
				setError('Не удалось изменить данные пользователя');
			} else {
				// Refresh user data
				if (user.email !== currentUserEmail)
					navigate(`/user/${encodeURIComponent(user.email)}`);
				await loadUser();
			}
			
			setShowUpdateUserModal(false);
		} catch (error) {
			console.error('Ошибка при изменении данных пользователя:', error);
			setError('Произошла ошибка при изменении данных пользователя');
		}
	};
	/**
	 * Function for password update after confirm
	 * @param {Object} formData Object for update the password
	 */
	const onConfirmUpdateUserPassword = async (formData) => {
		try {
			const token = AuthService.getToken();
			const updatePasswordRequest = new UpdatePasswordRequest('', formData.password);
			const response = await UserService.updateUserPassword(
				token, currentUserEmail, updatePasswordRequest
			);

			if (response.error) {
				setError(response.error);
			} else if (!response.success) {
				setError('Не удалось изменить пароль пользователя');
			}
			
			setShowUpdateUserPasswordModal(false);
		} catch (error) {
			console.error('Ошибка при изменении пароля пользователя:', error);
			setError('Произошла ошибка при изменении пароля пользователя');
		}
	};
	const onConfirmDeleteUser = async () => {
		try {
			const token = AuthService.getToken();
			const response = await UserService.deleteUser(token, new User('','','',currentUserEmail));

			if (response.error) {
				setError(response.error);
			} else if (!response.success) {
				setError('Не удалось удалить пользователя');
			} else {
				// Redirect to users
				navigate(`/users`);
			}
			
			setShowUpdateUserModal(false);
		} catch (error) {
			console.error('Ошибка при удалении пользователя:', error);
			setError('Произошла ошибка при удалении пользователя');
		}
	};

	const UserCard = ({element}) => {
		return (
			<div className="account-card">
				<h2>Информация о пользователе</h2>
				<div className="account-info">
					<p><strong>Email:</strong> {element.email}</p>
					<p><strong>Фамилия:</strong> {element.surname}</p>
					<p><strong>Имя:</strong> {element.name}</p>
					<p><strong>Отчество:</strong> {element.patronymic}</p>
					<p><strong>Создан:</strong> {element.createdAt}</p>
				</div>
			</div>
		);
	};


	return (
		<div>
			<MainContent>
				<h1 className="account-title">Данные пользователя</h1>
				{isLoading ? (
					<LoadingSpinner title={'Загрузка данных пользователя'}/>
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
							onClick={loadUser}
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
						<UserCard user={user} />
						<button
							onClick={() => setShowUpdateUserModal(true)}
							style={{ padding: '10px 20px', cursor: 'pointer' }}
						>
							Изменить данные
						</button>
						<button
							onClick={() => setShowUpdateUserPasswordModal(true)}
							style={{ padding: '10px 20px', cursor: 'pointer' }}
						>
							Изменить пароль
						</button>
						<button
							onClick={() => setShowDeleteUserModal(true)}
							style={{ padding: '10px 20px', cursor: 'pointer' }}
						>
							Удалить пользователя
						</button>
					</div>
				)}
			</MainContent>

			<UpdateUserModal
				isOpen={showUpdateUserModal}
				onClose={() => { setShowUpdateUserModal(false); setError(''); }}
				onConfirm={onConfirmUpdateUser}
				error={error}
			/>
			<UpdateUserPasswordModal
				isOpen={showUpdateUserPasswordModal}
				onClose={() => { setShowUpdateUserPasswordModal(false); setError(''); }}
				onConfirm={onConfirmUpdateUserPassword}
				error={error}
			/>
			<DeleteUserModal
				isOpen={showDeleteUserModal}
				onClose={() => { setShowDeleteUserModal(false); setError(''); }}
				onConfirm={onConfirmDeleteUser}
				error={error}
			/>
		</div>
	);
}

export default UserPage;
