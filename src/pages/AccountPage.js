import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainContent from '../components/MainContent';
import ChangePasswordModal from '../components/ChangePasswordModal';
import AuthService from '../services/AuthService';
import AdminService from '../services/AdminService';
import GroupService from '../services/GroupService';

import LoadingSpinner from '../components/LoadingSpinner';
import RedirectionButton from '../components/element/RedirectionButton';

import '../styles/AccountPage.css';
import '../styles/blue-button.css';
import '../styles/green-button.css';
import '../styles/buttons-row.css';



function AccountPage() {
	const [user, setUser] = useState(null);
	const [groups, setGroups] = useState(null);
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
	let [isLoading, setIsLoading] = useState(true);
	let [isLoadingUser, setIsLoadingUser] = useState(true);
	let [isLoadingGroups, setIsLoadingGroups] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);
	const [error, setError] = useState('')
	const navigate = useNavigate();
	
	useEffect(() => {
		const checkAuthAndLoadUser = async () => {
			try {
				const result = await AuthService.checkAuth();
				
				if (result.authenticated) {
					setUser(result.user);
					if (result.user) {
						AuthService.setUser(result.user);
						setIsLoadingUser(false);
					}
				} else {
					navigate('/login');
				}
			} catch (error) {
				console.error('Ошибка проверки авторизации:', error);
				navigate('/login');
			} finally {
				setIsLoadingUser(false);
				isLoadingUser=false;
				setIsLoading(prev => prev && isLoadingGroups);
			}
		};
		
		const checkIsAdmin = async () => {
			try {
				const result = await AdminService.isAdmin(AuthService.getToken());
				if (result.isAdmin)
					setIsAdmin(true);
			} catch (error){
			}
		}


		const loadGroups = async () => {
			try{
				const result = await GroupService.getMyGroups(AuthService.getToken());
				if (result.error){
					setError(result.error);
					return;
				}

				setGroups(result);
				console.log(result);
			} catch (error){
				setError(error);
			} finally {
				setIsLoadingGroups(false);
				isLoadingGroups=false;
				setIsLoading(prev => isLoadingUser && prev);
			}
		}
		
		checkAuthAndLoadUser();
		checkIsAdmin();
		loadGroups();
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

	if (!user && !isLoadingUser) {
		return null;
	}



	const createNavigateToGroupHref = (name) => {
		return `/group/${encodeURIComponent(name)}`;
	};
	const GroupRow = ({ group }) => {
		return (
			<tr key={`group-${group.name}`}>
				<td>{group.name}</td>
				<td>{group.membersCount}</td>
				<td>{group.creatorEmail}</td>
				<td>
					<RedirectionButton reference={createNavigateToGroupHref(group.name)} title={'Изменить данные'} className='blue-button' />
				</td>
			</tr>
		);
	};
	const GroupTable = ({ groups }) => {
		return (
			<div>
				<table className='file-table'>
					<thead>
						<tr>
							<th>Название</th>
							<th>Число участников</th>
							<th>Почта создателя</th>
							<th>Действия</th>
						</tr>
					</thead>
					<tbody>
						{groups && groups.length > 0 ? (
							groups.map(element => <GroupRow key={element.name} group={element} />)
						) : (
							<tr>
								<td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
									Группы не найдены
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		);
	};

	return (
		<div>
			<MainContent>
				{isLoading ? (
					<LoadingSpinner title={'Загрузка данных пользователя'} />
				) : (
					<div>
						<h1 className="account-title">Личный кабинет</h1>
						<div className="account-container">
							<div className="account-card">
								<h2>Информация о пользователе</h2>
								<div className="account-info">
									<p><strong>Email:</strong> {user.email}</p>
									<p><strong>Фамилия:</strong> {user.surname}</p>
									<p><strong>Имя:</strong> {user.name}</p>
									<p><strong>Отчество:</strong> {user.patronymic}</p>
								</div>
								<div className='buttons-row'>
									<button
										onClick={()=>{setIsPasswordModalOpen(true)}} 
										className="logout-button"
										>
										Обновить пароль
									</button>
									<button onClick={handleLogout} className="logout-button">
										Выйти
									</button>
								</div>
							</div>
							{isAdmin ? (
								<div className='buttons-row'>
									<RedirectionButton reference={'/users'} title={'Пользователи'}  className='blue-button' />
									<RedirectionButton reference={'/groups'} title={'Группы'}  className='blue-button' />
									{/*TODO: Create route to add himself to group*/}
									<button onClick={()=>{navigate('/users')}} className="green-button">
										Вступить в группу
									</button>
								</div>
							): <></>}
							{!isLoadingGroups ? (
								<>
									<h1>Ваши группы</h1>
									<GroupTable groups={groups} />
								</>
							) : <></>}
						</div>
					</div>
				)}
			</MainContent>
			{!isLoading ? (
			<ChangePasswordModal
				isOpen={isPasswordModalOpen}
				onClose={closePasswordModal}
				userEmail={user.email}
				onUpdatePassword={handleUpdatePassword}
				authToken={getAuthToken()}
			/>) : (<></> )}
		</div>
	);
};

export default AccountPage;