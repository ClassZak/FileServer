import React, { use, useState, useEffect } from 'react';
import Modal from '../Modal';
import User from '../../../entity/User';


/**
 * Modal window for add user to group
 * @param {Object} props
 * @param {boolean} props.isOpen Is open window
 * @param {function} props.onClose Modal window closing function
 * @param {function} props.onConfirm Confirm form function
 * @param {Array} props.users Users for choose
 * @param {string} props.groupName Group name
 */

function AddUserToGroupModal({
	isOpen,
	onClose,
	onConfirm,
	users = [],
	groupName = ''
}) {
	const [submitting, setSubmitting] = useState(false);
	const [selectedUserEmail, setSelectedUserEmail] = useState('');
	const [errors, setErrors] = useState({});
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [searchQuery, setSearchQuery] = useState('');

	// Фильтрация пользователей по поисковому запросу
	useEffect(() => {
		if (searchQuery.trim() === '') {
			setFilteredUsers(users);
		} else {
			const query = searchQuery.toLowerCase();
			const filtered = users.filter(user => 
				user.email.toLowerCase().includes(query) ||
				user.surname.toLowerCase().includes(query) ||
				user.name.toLowerCase().includes(query) ||
				user.patronymic.toLowerCase().includes(query)
			);
			setFilteredUsers(filtered);
		}
	}, [searchQuery, users]);

	// Сброс формы при открытии/закрытии
	useEffect(() => {
		if (!isOpen) {
			setSelectedUserEmail('');
			setErrors({});
			setSearchQuery('');
		}
	}, [isOpen]);

	const handleSearchChange = (e) => {
		setSearchQuery(e.target.value);
	};

	const handleUserSelect = (userEmail) => {
		setSelectedUserEmail(userEmail);
		setSearchQuery('');
		
		if (errors.userEmail) {
			setErrors(prev => ({
				...prev,
				userEmail: null
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};
		
		if (!selectedUserEmail.trim()) {
			newErrors.userEmail = 'Выберите пользователя';
		}
		
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (submitting) return;
		
		if (!validateForm()) {
			return;
		}
		
		setSubmitting(true);
		try {
			await onConfirm(selectedUserEmail);
			setSelectedUserEmail('');
			setSearchQuery('');
		} catch (error) {
			console.error('Ошибка добавления пользователя:', error);
			setErrors(prev => ({
				...prev,
				server: error.message || 'Ошибка добавления пользователя'
			}));
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		setSelectedUserEmail('');
		setErrors({});
		setSearchQuery('');
		onClose();
	};

	// Найти выбранного пользователя для отображения
	const selectedUser = users.find(user => user.email === selectedUserEmail);

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title={`Добавить пользователя в группу "${groupName}"`}
			width="600px"
		>
			<form onSubmit={handleSubmit} className="add-user-to-group-form">
				{errors.server && (
					<div className="error-message" style={{ 
						background: '#ffebee', 
						color: '#c62828', 
						padding: '10px', 
						borderRadius: '4px',
						marginBottom: '15px'
					}}>
						{errors.server}
					</div>
				)}

				<div className="form-group" style={{ marginBottom: '20px' }}>
					<label htmlFor="userSearch">Выберите пользователя для добавления *</label>
					
					{/* Поле поиска пользователей */}
					<input
						id="userSearch"
						type="text"
						value={searchQuery}
						onChange={handleSearchChange}
						placeholder="Начните вводить email, фамилию или имя пользователя"
						disabled={submitting}
						style={{
							width: '100%',
							padding: '10px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							fontSize: '14px',
							marginBottom: '10px'
						}}
					/>

					{/* Выбранный пользователь */}
					{selectedUser && !searchQuery && (
						<div className="selected-user" style={{
							background: '#e3f2fd',
							padding: '10px',
							borderRadius: '4px',
							marginBottom: '10px',
							border: '1px solid #bbdefb'
						}}>
							<div style={{ fontWeight: 'bold' }}>
								Выбран: {selectedUser.surname} {selectedUser.name} {selectedUser.patronymic}
							</div>
							<div style={{ color: '#666', fontSize: '14px' }}>
								{selectedUser.email}
							</div>
							<button
								type="button"
								onClick={() => setSelectedUserEmail('')}
								style={{
									background: 'none',
									border: 'none',
									color: '#2196f3',
									cursor: 'pointer',
									fontSize: '12px',
									marginTop: '5px'
								}}
							>
								Изменить
							</button>
						</div>
					)}

					{/* Список пользователей */}
					{searchQuery && filteredUsers.length > 0 && (
						<div className="user-list" style={{
							maxHeight: '200px',
							overflowY: 'auto',
							border: '1px solid #ccc',
							borderRadius: '4px',
							marginBottom: '10px'
						}}>
							{filteredUsers.map(user => (
								<div
									key={user.email}
									className="user-item"
									onClick={() => handleUserSelect(user.email)}
									style={{
										padding: '10px',
										cursor: 'pointer',
										borderBottom: '1px solid #eee',
										transition: 'background 0.2s'
									}}
									onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
									onMouseLeave={(e) => e.target.style.background = 'white'}
								>
									<div style={{ fontWeight: 'bold' }}>
										{user.surname} {user.name} {user.patronymic}
									</div>
									<div style={{ color: '#666', fontSize: '14px' }}>
										{user.email}
									</div>
								</div>
							))}
						</div>
					)}

					{searchQuery && filteredUsers.length === 0 && (
						<div style={{ 
							color: '#666', 
							padding: '10px', 
							textAlign: 'center',
							fontSize: '14px'
						}}>
							Пользователи не найдены
						</div>
					)}

					{/* Скрытое поле для формы */}
					<input
						type="hidden"
						name="userEmail"
						value={selectedUserEmail}
						required
					/>

					{errors.userEmail && (
						<div className="error-text" style={{ 
							color: '#c62828', 
							fontSize: '12px', 
							marginTop: '5px' 
						}}>
							{errors.userEmail}
						</div>
					)}
				</div>

				<div className="form-info" style={{
					background: '#f5f5f5',
					padding: '15px',
					borderRadius: '4px',
					marginBottom: '20px',
					fontSize: '14px',
					color: '#666'
				}}>
					<div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
						Информация:
					</div>
					<ul style={{ margin: '0', paddingLeft: '20px' }}>
						<li>Будут показаны только пользователи, которых еще нет в группе</li>
					</ul>
				</div>

				<div style={{ 
					display: 'flex', 
					gap: '10px', 
					marginTop: '20px' 
				}}>
					<button
						type="button"
						onClick={handleClose}
						disabled={submitting}
						style={{ 
							flex: 1,
							padding: '12px',
							background: '#f5f5f5',
							border: '1px solid #ddd',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '14px',
							transition: 'background 0.2s'
						}}
						onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
						onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
					>
						Отмена
					</button>
					<button
						type="submit"
						disabled={submitting}
						style={{ 
							flex: 1,
							padding: '12px',
							background: submitting ? '#ccc' : '#4caf50',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: submitting ? 'not-allowed' : 'pointer',
							fontSize: '14px',
							transition: 'background 0.2s'
						}}
					>
						{submitting ? (
							<>
								<span className="spinner" style={{
									display: 'inline-block',
									width: '12px',
									height: '12px',
									border: '2px solid rgba(255,255,255,0.3)',
									borderTopColor: 'white',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite',
									marginRight: '8px'
								}} />
								Добавление...
							</> 
						) : 'Добавить пользователя'}
					</button>
				</div>

				<style>{`
					@keyframes spin {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
					
					.add-user-to-group-form label {
						display: block;
						margin-bottom: 5px;
						font-weight: 500;
						color: #333;
					}
					
					.user-item:hover {
						background-color: #f5f5f5;
					}
					
					.user-item:last-child {
						border-bottom: none;
					}
				`}</style>
			</form>
		</Modal>
	);
}

export default AddUserToGroupModal;