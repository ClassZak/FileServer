// UpdateGroupModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { GroupCreateModel } from '../../../entity/GroupCreateModel';

/**
 * Модальное окно для обновления существующей группы
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Открыто ли модальное окно
 * @param {function} props.onClose - Функция закрытия модального окна
 * @param {function} props.onConfirm - Функция подтверждения обновления
 * @param {Array} props.users - Список пользователей для выбора создателя группы
 * @param {Object} props.currentGroup - Текущие данные группы для редактирования
 * @param {string} props.currentGroup.name - Текущее название группы
 * @param {string} props.currentGroup.creatorEmail - Email текущего создателя
 */
function UpdateGroupModal({
	isOpen,
	onClose,
	onConfirm,
	users = [],
	currentGroup = {}
}) {
	const [submitting, setSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		newName: currentGroup.name || '',
		creatorEmail: currentGroup.creatorEmail || ''
	});
	const [errors, setErrors] = useState({});
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [showUsersList, setShowUsersList] = useState(false);

	// Инициализация формы при открытии или изменении currentGroup
	useEffect(() => {
		if (isOpen && currentGroup) {
			setFormData({
				newName: currentGroup.name || '',
				creatorEmail: currentGroup.creatorEmail || ''
			});
		}
	}, [isOpen, currentGroup]);

	// Фильтрация пользователей по поисковому запросу
	useEffect(() => {
		if (searchQuery.trim() === '') {
			setFilteredUsers(users);
		} else {
			const query = searchQuery.toLowerCase();
			const filtered = users.filter(user => 
				user.email.toLowerCase().includes(query) ||
				(user.surname && user.surname.toLowerCase().includes(query)) ||
				(user.name && user.name.toLowerCase().includes(query)) ||
				(user.patronymic && user.patronymic.toLowerCase().includes(query))
			);
			setFilteredUsers(filtered);
		}
	}, [searchQuery, users]);

	// Сброс формы при закрытии
	useEffect(() => {
		if (!isOpen) {
			setFormData({
				newName: currentGroup.name || '',
				creatorEmail: currentGroup.creatorEmail || ''
			});
			setErrors({});
			setSearchQuery('');
			setShowUsersList(false);
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
		setShowUsersList(true);
	};

	const handleUserSelect = (userEmail) => {
		setFormData(prev => ({
			...prev,
			creatorEmail: userEmail
		}));
		setShowUsersList(false);
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
		
		if (!formData.newName.trim()) {
			newErrors.newName = 'Название группы обязательно';
		} else if (formData.newName.length < 3) {
			newErrors.newName = 'Название должно содержать минимум 3 символа';
		} else if (formData.newName.length > 64) {
			newErrors.newName = 'Название не должно превышать 64 символа';
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
		} catch (error) {
			console.error('Ошибка обновления группы:', error);
			setErrors(prev => ({
				...prev,
				server: error.message || 'Ошибка обновления группы'
			}));
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		setFormData({
			newName: currentGroup.name || '',
			creatorEmail: currentGroup.creatorEmail || ''
		});
		setErrors({});
		setSearchQuery('');
		setShowUsersList(false);
		onClose();
	};

	const handleCancelSelect = () => {
		setFormData(prev => ({ ...prev, creatorEmail: '' }));
		setSearchQuery('');
		setShowUsersList(true);
	};

	// Найти выбранного пользователя для отображения
	const selectedUser = users.find(user => user.email === formData.creatorEmail);

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Редактировать группу"
			width="600px"
		>
			<form onSubmit={handleSubmit} className="group-update-form">
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
						name="newName"
						type="text"
						value={formData.newName}
						onChange={handleInputChange}
						placeholder="Введите новое название группы"
						disabled={submitting}
						required
						style={{
							width: '100%',
							padding: '10px',
							border: `1px solid ${errors.newName ? '#c62828' : '#ccc'}`,
							borderRadius: '4px',
							fontSize: '14px'
						}}
						maxLength={64}
					/>
					{errors.newName && (
						<div className="error-text" style={{ 
							color: '#c62828', 
							fontSize: '12px', 
							marginTop: '5px' 
						}}>
							{errors.newName}
						</div>
					)}
					<div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
						От 3 до 64 символов. Текущее название: <strong>{currentGroup.name}</strong>
					</div>
				</div>

				<div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
					<label htmlFor="creatorSearch">Создатель группы *</label>
					
					{/* Поле поиска пользователей */}
					<div style={{ position: 'relative' }}>
						<input
							id="creatorSearch"
							type="text"
							value={searchQuery}
							onChange={handleSearchChange}
							onFocus={() => setShowUsersList(true)}
							placeholder="Начните вводить email, фамилию или имя пользователя"
							disabled={submitting}
							style={{
								width: '100%',
								padding: '10px 40px 10px 10px',
								border: `1px solid ${errors.creatorEmail ? '#c62828' : '#ccc'}`,
								borderRadius: '4px',
								fontSize: '14px',
								marginBottom: '10px'
							}}
						/>
						{selectedUser && !showUsersList && (
							<button
								type="button"
								onClick={handleCancelSelect}
								style={{
									position: 'absolute',
									right: '10px',
									top: '10px',
									background: 'none',
									border: 'none',
									color: '#666',
									cursor: 'pointer',
									fontSize: '20px',
									lineHeight: '1'
								}}
							>
								×
							</button>
						)}
					</div>

					{/* Выбранный пользователь */}
					{selectedUser && !showUsersList && (
						<div className="selected-user" style={{
							background: '#e3f2fd',
							padding: '10px',
							borderRadius: '4px',
							marginBottom: '10px',
							border: '1px solid #bbdefb'
						}}>
							<div style={{ fontWeight: 'bold' }}>
								Текущий создатель: {selectedUser.surname} {selectedUser.name} {selectedUser.patronymic}
							</div>
							<div style={{ color: '#666', fontSize: '14px' }}>
								{selectedUser.email}
							</div>
						</div>
					)}

					{/* Список пользователей */}
					{showUsersList && filteredUsers.length > 0 && (
						<div className="user-list" style={{
							maxHeight: '200px',
							overflowY: 'auto',
							border: '1px solid #ccc',
							borderRadius: '4px',
							marginBottom: '10px',
							position: 'absolute',
							width: '100%',
							background: 'white',
							zIndex: 1000,
							boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
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
										transition: 'background 0.2s',
										background: user.email === formData.creatorEmail ? '#e3f2fd' : 'white'
									}}
									onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
									onMouseLeave={(e) => e.target.style.background = user.email === formData.creatorEmail ? '#e3f2fd' : 'white'}
								>
									<div style={{ fontWeight: 'bold' }}>
										{user.surname} {user.name} {user.patronymic}
									</div>
									<div style={{ color: '#666', fontSize: '14px' }}>
										{user.email}
									</div>
									{user.email === formData.creatorEmail && (
										<div style={{ fontSize: '12px', color: '#2196f3' }}>
											Текущий выбор
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{showUsersList && filteredUsers.length === 0 && (
						<div style={{ 
							color: '#666', 
							padding: '10px', 
							textAlign: 'center',
							fontSize: '14px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							marginBottom: '10px'
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
						Важная информация:
					</div>
					<ul style={{ margin: '0', paddingLeft: '20px' }}>
						<li>Изменение названия группы приведёт к обновлению всех ссылок и путей</li>
						<li>Новый создатель группы автоматически станет её участником</li>
						<li>Прежний создатель останется участником группы, если не был удалён</li>
						<li>Только администраторы могут редактировать группы</li>
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
								Обновление...
							</> 
						) : 'Сохранить изменения'}
					</button>
				</div>

				<style>{`
					@keyframes spin {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
					
					.group-update-form label {
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

export default UpdateGroupModal;