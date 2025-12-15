import React, { useState } from 'react';
import Modal from '../../Modal';

function UpdateUserModal({
	isOpen,
	onClose,
	onConfirm
}) {
	const [submitting, setSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		surname: '',
		name: '',
		patronymic: '',
		email: '',
		password: ''
	});

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		const fieldName = name.replace('user.', '');
		setFormData(prev => ({
			...prev,
			[fieldName]: value
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (submitting) return;
		
		setSubmitting(true);
		try {
			await onConfirm(formData);
		} catch (error) {
			console.error(error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		setFormData({
			surname: '',
			name: '',
			patronymic: '',
			email: '',
			password: ''
		});
		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title={'Изменить данные пользователя'}
		>
			<form onSubmit={handleSubmit}>
				<label htmlFor="user.surname">Фамилия</label>
				<input
					id="user.surname"
					name="user.surname"
					type="text"
					value={formData.surname}
					onChange={handleInputChange}
					placeholder="Фамилия"
					disabled={submitting}
					required
				/>
				
				<label htmlFor="user.name">Имя</label>
				<input
					id="user.name"
					name="user.name"
					type="text"
					value={formData.name}
					onChange={handleInputChange}
					placeholder="Имя"
					disabled={submitting}
					required
				/>
				
				<label htmlFor="user.patronymic">Отчество</label>
				<input
					id="user.patronymic"
					name="user.patronymic"
					type="text"
					value={formData.patronymic}
					onChange={handleInputChange}
					placeholder="Отчество"
					disabled={submitting}
					required
				/>
				
				<label htmlFor="user.email">Почта</label>
				<input
					id="user.email"
					name="user.email"
					type="email"
					value={formData.email}
					onChange={handleInputChange}
					placeholder="Почта"
					disabled={submitting}
					required
				/>

				<div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
					<button
						type="button"
						onClick={handleClose}
						disabled={submitting}
						style={{ flex: 1 }}
					>
						Отмена
					</button>
					<button
						type="submit"
						disabled={submitting}
						style={{ flex: 1 }}
					>
						{submitting ? 'Изменение...' : 'Изменить'}
					</button>
				</div>
			</form>
		</Modal>
	);
}

export default UpdateUserModal;