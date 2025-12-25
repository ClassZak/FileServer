import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import MainContent from "../components/MainContent";
import AuthService from '../services/AuthService';
import AdminService from '../services/AdminService';
import GroupService from '../services/GroupService';
import UserService from '../services/UserService';


import DeleteGroupModal from '../components/modal/group/DeleteGroupModal';
import UpdateGroupModal from '../components/modal/group/UpdateGroupModal';
import RemoveUserFromGroupModal from '../components/modal/group/RemoveUserFromGroupModal';
import AddUserToGroupModal from '../components/modal/group/AddUserToGroupModal';


import LoadingSpinner from '../components/LoadingSpinner';
import RedirectionButton from '../components/element/RedirectionButton';




import GroupBasicInfo from '../services/GroupService'
import GroupDetails from '../services/GroupService'
import { GroupUpdateModel } from '../entity/GroupUpdateModel';
import User from '../entity/User';




import '../styles/blue-button.css';
import '../styles/red-button.css';
import '../styles/green-button.css';
import '../styles/orange-button.css';
import '../styles/buttons-row.css';







function GroupPage(){
	const { '*': pathParam } = useParams();
	const [showUpdateGroupModal, setShowUpdateGroupModal] = useState(false);
	const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
	const [showRemoveUserFromGroupModal, setShowRemoveUserFromGroupModal] = useState(false);
	const [showAddUserToGroupModal, setShowAddUserToGroupModal] = useState(false);
	const [isLoadingGroup, setIsLoadingGroup] = useState(true);
	const [isLoadingIsAdmin, setIsLoadingIsAdmin] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoadingUsers, setIsLoadingUsers] = useState(true);
	const [error, setError] = useState('');
	const [group, setGroup] = useState({});
	const [users, setUsers] = useState([]);
	// Object for add and remove from group. User class
	const [userForModal, setUserForModal] = useState({});
	const navigate = useNavigate();

	const currentGroupName = pathParam || '';

	const checkAuth = async () => {
		try {
			setIsLoadingIsAdmin(true);
			const isAdminResponse = await AdminService.isAdmin(AuthService.getToken());
			if (!isAdminResponse?.isAdmin) {
				setIsAdmin(false);
				setIsLoadingIsAdmin(false);
				return;
			}
			setIsAdmin(true);
		} catch (error) {
			console.error('Ошибка проверки прав:', error);
			setError('Ошибка проверки прав доступа');
			setIsAdmin(false);
		} finally {
			setIsLoadingIsAdmin(false);
		}
	};


	const loadUsers = async () => {
		try {
			setIsLoadingUsers(true);
			setUsers([]);
			const token = AuthService.getToken();
			const response = await UserService.readAllUsers(token);
			
			if (response.error) {
				setError(response.error);
				setUsers([]);
			} else if (response.users) {
				setUsers(response.users);
			}
		} catch (error) {
			console.error('Ошибка при загрузке пользователей:', error);
			setError('Не удалось загрузить список пользователей');
			setUsers([]);
		} finally {
			setIsLoadingUsers(false);
		}
	};
	


	const loadGroup = async () => {
		try {
			setGroup({});
			setIsLoadingGroup(true);
			while(isLoadingIsAdmin);

			const result = isAdmin ? 
				await GroupService.getGroupFullDetailsAdmin(
					AuthService.getToken(), currentGroupName
				) : 
				await GroupService.getGroupFullDetails(
					AuthService.getToken(), currentGroupName
				);



			if(result === null) {
				navigate('/groups');
				return;
			}
			if(result.error)
				setError(result.error)
			else if(result.group)
				setGroup(result.group)
			else {
				setIsLoadingGroup(false);
				setIsLoadingGroup(false);
				navigate('/groups');
			}
			setIsLoadingGroup(false);
		} catch (error) {
			setIsLoadingGroup(false);
			navigate('/groups');
		}
	};


	useEffect(() => {
		const init = async () => {
			if (currentGroupName === '') {
				navigate('/groups');
				return;
			}
			await checkAuth();
		};
		init();
	}, []);
	useEffect(() => {
		if (!isLoadingIsAdmin) {
			loadGroup();
			if (isAdmin)
				loadUsers();
		}
	}, [isLoadingIsAdmin]);





	const onConfirmDeleteGroup = async () => {
		try {
			const response = await GroupService.deleteGroup(
				AuthService.getToken(), currentGroupName
			);

			if (response.error)
				setError(response.error);
			else
				navigate(`/groups`);
			
			setShowDeleteGroupModal(false);
		} catch (error) {
			console.error('Ошибка при удалении группы:', error);
			setError('Произошла ошибка при удалении группы');
		}
	};


	/**
	 * Function for group update handling
	 * @param {GroupUpdateModel} formData Data for update group
	 */
	const onConfirmUpdateGroup = async (formData) => {
		try {
			const response = await GroupService.updateGroup(
				AuthService.getToken(), currentGroupName, formData
			);

			setShowUpdateGroupModal(false);

			if (response.error)
				setError(response.error);
			else
				loadGroup();
			
		} catch (error) {
			console.error('Ошибка при удалении группы:', error);
			setError('Произошла ошибка при удалении группы');
		}
	}


	/**
	 * Function for renove user from group
	 * uses userForModal User class
	 */
	const onConfirmRemoveUserFromGroup = async () => {
		try {
			const response = await GroupService.removeUserFromGroup(
				AuthService.getToken(), currentGroupName, userForModal.email
			);
			if (response.error)
				setError(response.error);
			else
				loadGroup();

			setShowRemoveUserFromGroupModal(false);
		} catch (error){
			console.error('Ошибка при удалении пользователя из группы:', error);
			setError('Произошла ошибка при удалении пользователя из группы');
		}
	}
	/**
	 * Function for adding user to group
	 * @param {string} userEmail Email of user to add
	 */
	const onConfirmAddUserToGroup = async (userEmail) => {
		try {
			const response = await GroupService.addUserToGroup(
				AuthService.getToken(), currentGroupName, userEmail
			);
			
			if (response.error)
				setError(response.error);
			else
				loadGroup();
			
			setShowAddUserToGroupModal(false);
		} catch (error) {
			console.error('Ошибка при добавлении пользователя в группу:', error);
			setError('Произошла ошибка при добавлении пользователя в группу');
		}
	};


	const createNavigateToUserHref = (email) => {
		return `/user/${encodeURIComponent(email)}`;
	};
	const UserRowAdmin = ({ element }) => {
		console.log(element);
		return (
			<tr key={`user-${element.email}`}>
				<td>{element.surname}</td>
				<td>{element.name}</td>
				<td>{element.patronymic}</td>
				<td>{element.email}</td>
				<td>{element.createdAt}</td>
				<td>
					{/* TODO: Create modal for remove from group */}
					<div className='buttons-row'>
						<RedirectionButton
							reference={createNavigateToUserHref(element.email)} 
							title={'Изменить данные'}
							className='blue-button'
						/>
						<button
							onClick={()=>{
								setUserForModal(element); setShowRemoveUserFromGroupModal(true);}
							}
							style={{ cursor: 'pointer', padding: '8px 16px' }}
							className='red-button'
						>
							Исключить из группы
						</button>
					</div>
				</td>
			</tr>
		);
	};
	const UserTableAdmin = ({ users }) => {
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
						users.map(element => {console.log(element);  return (<UserRowAdmin key={element.email} element={element} />);})
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
	const GroupCardAdmin = ({element}) => {
		return (
			<>
				<div className="account-card">
					<h2>Информация о группе</h2>
					<div className="account-info">
						<p><strong>Название:</strong> {element.name}</p>
						<p><strong>Количество участников:</strong> {element.membersCount}</p>
						<p><strong>Создатель:</strong>{element.creator.toString()}</p>
					</div>
					<UserTableAdmin users={element.members} />
				</div>
				
			</>
		);
	};
	const UserRow = ({ element }) => {
		console.log(element);
		return (
			<tr key={`user-${element.email}`}>
				<td>{element.surname}</td>
				<td>{element.name}</td>
				<td>{element.patronymic}</td>
				<td>{element.email}</td>
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
					</tr>
				</thead>
				<tbody>
					{users && users.length > 0 ? (
						users.map(element => {console.log(element);  return (<UserRow key={element.email} element={element} />);})
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
	const GroupCard = ({element}) => {
		return (
			<>
				<div className="account-card">
					<h2>Информация о группе</h2>
					<div className="account-info">
						<p><strong>Название:</strong> {element.name}</p>
						<p><strong>Количество участников:</strong> {element.membersCount}</p>
						<p><strong>Создатель:</strong>{element.creator.toString()}</p>
					</div>
					<h2>Участники группы</h2>
					<UserTable users={element.members} />
				</div>
				
			</>
		);
	};




	return (
		<>
			<MainContent>
				{isLoadingGroup || isLoadingIsAdmin || isLoadingUsers ? (
					<LoadingSpinner title={'Загрузка данных группы'}/>
				) : isAdmin ? (
					<>
						<GroupCardAdmin element={group} />
						<div className='buttons-row'>
							<button
								onClick={() => setShowDeleteGroupModal(true)}
								className='red-button'
								>
								Удалить группу
							</button>
							<button
								onClick={() => setShowUpdateGroupModal(true)}
								className='orange-button'
								>
								Обновить данные группы
							</button>
							<button
								onClick={() => setShowAddUserToGroupModal(true)}
								className='green-button'
							>
								Добавить пользователя в группу
							</button>
						</div>
					</>
				) : (
					<GroupCard element={group} />
				)}
			</MainContent>
			{!isLoadingGroup && !isLoadingIsAdmin && !isLoadingUsers ? (
				<>
					<DeleteGroupModal
						isOpen={showDeleteGroupModal}
						onClose={()=>{setShowDeleteGroupModal(false); setError('');}}
						onConfirm={onConfirmDeleteGroup}
						error={error}
						name={currentGroupName}
					/>
					<UpdateGroupModal 
						isOpen={showUpdateGroupModal}
						onClose={()=>{setShowUpdateGroupModal(false); setError('');}}
						onConfirm={onConfirmUpdateGroup}
						users={users}
						currentGroup={new GroupUpdateModel(group.name, group.creator.email)}
					/>
					<RemoveUserFromGroupModal
						isOpen={showRemoveUserFromGroupModal}
						onClose={()=>{setShowRemoveUserFromGroupModal(false); setError('');}}
						onConfirm={onConfirmRemoveUserFromGroup}
						name={currentGroupName}
						user={userForModal}
					/>
					<AddUserToGroupModal
						isOpen={showAddUserToGroupModal}
						onClose={()=>{setShowAddUserToGroupModal(false); setError('');}}
						onConfirm={onConfirmAddUserToGroup}
						users={users}
						groupName={currentGroupName}
					/>
				</>
			) : <></>}
		</>
	);
}

export default GroupPage;