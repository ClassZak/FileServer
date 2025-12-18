import React, { useState, useEffect, use } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import MainContent from "../components/MainContent";
import AuthService from '../services/AuthService';
import AdminService from '../services/AdminService';
import UserService from "../services/UserService";
import GroupService from '../services/GroupService';

import CreateGroupModal from '../components/modal/group/CreateGroupModal';


import LoadingSpinner from '../components/LoadingSpinner';


import GroupBasicInfo from '../services/GroupService'
import GroupDetails from '../services/GroupService'


import '../styles/FileTable.css';
import { GroupCreateModel } from '../entity/GroupCreateModel';




function GroupsPage(){
	const [users, setUsers] = useState([]);
	const [groups, setGroups] = useState([]);
	let [isLoadingUsers, setIsLoadingUsers] = useState(true);
	let [isLoadingGroups, setIsLoadingGroups] = useState(true);
	let [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
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

	const loadGroups = async () => {
		try {
			setGroups([]);
			const result = await GroupService.getAllGroups(AuthService.getToken());
			if (result.error)
				setError(error);
			else
				setGroups(result);
		} catch (error){
			setError(error);
		} finally {
			setIsLoadingGroups(false);
			isLoadingGroups = false;
			setIsLoading(prev => prev && isLoadingGroups);
		}
	}

	const loadUsers = async () => {
		try {
			setIsLoading(true);
			setUsers([]);
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
			setIsLoadingUsers(false);
			isLoadingUsers = false;
			setIsLoading(prev => prev && isLoadingUsers);
		}
	};

	// Загрузка пользователей при открытии модального окна
	const handleOpenCreateModal = async () => {
		try {
			// Загрузите список пользователей (нужен отдельный метод в UserService)
			const usersData = await UserService.getAllUsers(AuthService.getToken());
			setUsers(usersData);
			setShowCreateGroupModal(true);
		} catch (error) {
			console.error('Ошибка загрузки пользователей:', error);
		}
	};

	// Создание группы
	const handleCreateGroup = async (groupData) => {
		try {
			const result = await GroupService.createGroup(AuthService.getToken(), new GroupCreateModel(groupData.name, groupData.creatorEmail));
			
			if (result.error) {
				throw new Error(result.error);
			}
			
			console.log('Группа создана:', result);
			setShowCreateGroupModal(false);
			
			loadGroups();
			
		} catch (error) {
			console.error('Ошибка создания группы:', error);
			throw error;
		}
	};

	useEffect(() => {
		const init = async () => {
			const isAdmin = await checkAuth();
			if (isAdmin) {
				await loadGroups();
				await loadUsers();
			}
		};
		init();
	}, []);
	
	const navigateToGroup = (name) => {
		navigate(`/group/${encodeURIComponent(name)}`);
	};

const GroupRow = ({ group }) => {
		return (
			<tr key={`group-${group.name}`}>
				<td>{group.name}</td>
				<td>{group.membersCount}</td>
				<td>{group.creatorEmail}</td>
				<td>
					<button
						onClick={() => navigateToGroup(group.name)}
						style={{ cursor: 'pointer', padding: '8px 16px' }}
					>
						Изменить данные
					</button>
				</td>
			</tr>
		);
	};

	const GroupTable = ({ groups }) => {
		return (
			<div>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
					<h1>Группы</h1>
					<button 
						onClick={() => setShowCreateGroupModal(true)}
						style={{ padding: '10px 20px', cursor: 'pointer' }}
					>
						Создать группу
					</button>
				</div>
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
		<>
			<MainContent>
				<h1>Все группы</h1>
				{isLoading ? (
					<LoadingSpinner title={'Загрузка списка групп'}/>
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
							onClick={loadGroups}
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
					<GroupTable groups={groups} />
				)}
			</MainContent>
			<CreateGroupModal
				isOpen={showCreateGroupModal}
				onClose={() => setShowCreateGroupModal(false)}
				onConfirm={handleCreateGroup}
				users={users}
			/>
		</>
	)
}

export default GroupsPage;