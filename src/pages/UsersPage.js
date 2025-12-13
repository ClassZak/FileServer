import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import MainContent from "../components/MainContent";
import CreateUserModal from "../components/CreateUserModal";
import AuthService from '../services/AuthService';
import AdminService from '../services/AdminService';
import User from "../entity/User";
import UserService from "../services/UserService";


function UsersPage(){
	const [showCreateUserModal, setShowCreateUserModal] = useState(false);
	const { '*': pathParam } = useParams();
	const [error, setError] = useState('');
	 const navigate = useNavigate();

	
	const checkAuth = async () => {
		const isAdminResponse = await AdminService.isAdmin(AuthService.getToken());
		if(!isAdminResponse?.isAdmin)
			navigate(`/account`);
	}
	useEffect(() => {
		checkAuth();
	});

	

	const onConfirmCreateUser = async (user) => {
		try {
			const token = AuthService.getToken();

			let response = await UserService.createUser(user, token);

			if(response.error)
				setError(response.error);
			else if(!response.success)
				setError('Не удалось создать нового пользователя');
			
			setShowCreateUserModal(false);
		} catch (error) {
			console.error(error);
		}
	};
	
	return (
		<div>
			<MainContent>
				<h1>Траллалелло-тра-ла-ла-ла</h1>				
			</MainContent>
			<CreateUserModal
				isOpen={showCreateUserModal}
				onClose={() => {setShowCreateUserModal(false)}}
				onConfirm={onConfirmCreateUser}
			/>
		</div>
	);
}

export default UsersPage;