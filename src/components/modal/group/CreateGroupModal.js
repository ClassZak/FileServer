import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { GroupCreateModel } from '../../../entity/GroupCreateModel';

/**
 * Модальное окно для создания новой группы
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Открыто ли модальное окно
 * @param {function} props.onClose - Функция закрытия модального окна
 * @param {function} props.onConfirm - Функция подтверждения формы
 * @param {Array} props.users - Список пользователей для выбора создателя новой группы
 */
function CreateGroupModal({
	isOpen,
	onClose,
	onConfirm,
	users = []
}) {
	const [submitting, setSubmitting] = useState(false);
	const [formData, setFormData] = useState(new GroupCreateModel());
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
			setFormData(new GroupCreateModel());
			setErrors({});
			setSearchQuery('');
		}
	}, [isOpen]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
		
		// Очистка ошибки при изменении поля
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: null
			}));
		}
	};

	const handleSearchChange = (e) => {
		setSearchQuery(e.target.value);
	};

	const handleUserSelect = (userEmail) => {
		setFormData(prev => ({
			...prev,
			creatorEmail: userEmail
		}));
		setSearchQuery('');
		
		if (errors.creatorEmail) {
			setErrors(prev => ({
				...prev,
				creatorEmail: null
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};
		
		if (!formData.name.trim()) {
			newErrors.name = 'Название группы обязательно';
		} else if (formData.name.length < 3) {
			newErrors.name = 'Название должно содержать минимум 3 символа';
		} else if (formData.name.length > 64) {
			newErrors.name = 'Название не должно превышать 64 символа';
		}
		
		if (!formData.creatorEmail.trim()) {
			newErrors.creatorEmail = 'Выберите создателя группы';
		} else if (!users.some(user => user.email === formData.creatorEmail)) {
			newErrors.creatorEmail = 'Выбранный пользователь не найден';
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
			await onConfirm(formData);
			setFormData(new GroupCreateModel());
			setSearchQuery('');
		} catch (error) {
			console.error('Ошибка создания группы:', error);
			setErrors(prev => ({
				...prev,
				server: error.message || 'Ошибка создания группы'
			}));
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		setFormData(new GroupCreateModel());
		setErrors({});
		setSearchQuery('');
		onClose();
	};

	// Найти выбранного пользователя для отображения
	const selectedUser = users.find(user => user.email === formData.creatorEmail);

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Создать новую группу"
			width="600px"
		>
			<form onSubmit={handleSubmit} className="group-create-form">
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
					<label htmlFor="groupName">Название группы *</label>
					<input
						id="groupName"
						name="name"
						type="text"
						value={formData.name}
						onChange={handleInputChange}
						placeholder="Введите название группы"
						disabled={submitting}
						required
						style={{
							width: '100%',
							padding: '10px',
							border: `1px solid ${errors.name ? '#c62828' : '#ccc'}`,
							borderRadius: '4px',
							fontSize: '14px'
						}}
						maxLength={64}
					/>
					{errors.name && (
						<div className="error-text" style={{ 
							color: '#c62828', 
							fontSize: '12px', 
							marginTop: '5px' 
						}}>
							{errors.name}
						</div>
					)}
					<div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
						От 3 до 64 символов
					</div>
				</div>

				<div className="form-group" style={{ marginBottom: '20px' }}>
					<label htmlFor="creatorSearch">Выберите создателя группы *</label>
					
					{/* Поле поиска пользователей */}
					<input
						id="creatorSearch"
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
								onClick={() => setFormData(prev => ({ ...prev, creatorEmail: '' }))}
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
						name="creatorEmail"
						value={formData.creatorEmail}
						required
					/>

					{errors.creatorEmail && (
						<div className="error-text" style={{ 
							color: '#c62828', 
							fontSize: '12px', 
							marginTop: '5px' 
						}}>
							{errors.creatorEmail}
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
						<li>Создатель группы автоматически становится её участником</li>
						<li>Название группы должно быть уникальным</li>
						<li>Только администраторы могут создавать группы</li>
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
							background: submitting ? '#ccc' : '#2196f3',
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
								Создание...
							</> 
						) : 'Создать группу'}
					</button>
				</div>

				<style>{`
					@keyframes spin {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
					
					.group-create-form label {
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

export default CreateGroupModal;