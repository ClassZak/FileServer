import React, { useState } from 'react';
import Modal from '../../Modal';

import UpdatePasswordRequest from '../../../entity/UpdatePasswordRequest';


function UpdateUserPasswordModal({
	isOpen,
	onClose,
	onConfirm
}) {
	const [submitting, setSubmitting] = useState(false);
	const [formData, setFormData] = useState({});

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
				<label htmlFor="user.password">Пароль</label>
				<input
					id="user.password"
					name="user.password"
					type="password"
					value={formData.password}
					onChange={handleInputChange}
					placeholder="Пароль"
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

export default UpdateUserPasswordModal;
