import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import MainContent from "../components/MainContent";
import AuthService from '../services/AuthService';
import AdminService from '../services/AdminService';
import GroupService from '../services/GroupService';


import DeleteGroupModal from '../components/modal/group/DeleteGroupModal';


import LoadingSpinner from '../components/LoadingSpinner';




import GroupBasicInfo from '../services/GroupService'
import GroupDetails from '../services/GroupService'




function GroupPage(){
	const { '*': pathParam } = useParams();
	const [showUpdateGroupModal, setShowUpdateGroupModal] = useState(false);
	const [showUpdateGroupPasswordModal, setShowUpdateGroupPasswordModal] = useState(false);
	const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingIsAdmin, setIsLoadingIsAdmin] = useState(true);
	const [isAdmin, setIsAdmin] = useState(true);
	const [error, setError] = useState('');
	const [group, setGroup] = useState({});
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

	const loadGroup = async () => {
		try {
			setGroup({});
			setIsLoading(true);
			while(isLoadingIsAdmin);

			const result = isAdmin ? 
				await GroupService.getGroupFullDetailsAdmin(
					AuthService.getToken(), currentGroupName
				) : 
				await GroupService.getGroupFullDetails(
					AuthService.getToken(), currentGroupName
				);

			if(result.error)
				setError(result.error)
			else if(result.group)
				setGroup(result.group)
			else
				setError(`Группа ${currentGroupName} не найдена`);
		} catch (error) {
			setError('Не удалось загрузить данные пользователя');
			setGroup({});
		} finally {
			setIsLoading(false);
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
			
			setShowUpdateGroupModal(false);
		} catch (error) {
			console.error('Ошибка при удалении группы:', error);
			setError('Произошла ошибка при удалении группы');
		}
	};



	const navigateToUser = (email) => {
		navigate(`/user/${encodeURIComponent(email)}`);
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
					<button
						onClick={() => navigateToUser(element.email)}
						style={{ cursor: 'pointer', padding: '8px 16px' }}
					>
						Изменить данные
					</button>
					{/* TODO: Create modal for remove from group */}
					<button
						onClick={() => navigateToUser(element.email)}
						style={{ cursor: 'pointer', padding: '8px 16px' }}
					>
						Исключить из группы
					</button>
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
				{isLoading || isLoadingIsAdmin ? (
					<LoadingSpinner title={'Загрузка данных группы'}/>
				) : isAdmin ? (
					<>
						<GroupCardAdmin element={group} />
						<button
							onClick={() => setShowDeleteGroupModal(true)}
						>
							Удалить группу
						</button>
					</>
				) : (
					<GroupCard element={group} />
				)}
			</MainContent>
			<DeleteGroupModal
				isOpen={showDeleteGroupModal}
				onClose={()=>{setShowDeleteGroupModal(false); setError('');}}
				onConfirm={onConfirmDeleteGroup}
				error={error}
				name={currentGroupName}
			/>
		</>
	);
}

export default GroupPage;