import React, { useState } from 'react';
import Modal from './Modal';
import User from '../entity/User';

function CreateUserModal({
	isOpen,
	onClose,
	onConfirm
}) {
	const [submitting, setSubmitting] = useState(false);

	let user = new User();

	const handleSubmit = async (e) => {
		if (e && e.preventDefault) {
			e.preventDefault();
		}
		
		if (submitting) return; // Stop resending
		
		setSubmitting(true);
		try {
			await onConfirm(user);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={'Создать нового пользователя'}
		>
			<form onSubmit={handleSubmit}>
				<label for="user.surname">Фамилия</label>
				<input
					name="user.surname"
					type="text"
					value={user.surname}
					placeholder="Фамилия"
					autoFocus
					disabled={submitting}
				/>
				<label for="user.name">Имя</label>
				<input
					name="user.name"
					type="text"
					value={user.name}
					placeholder="Имя"
					autoFocus
					disabled={submitting}
				/>
				<label for="user.patronymic">Отчество</label>
				<input
					name="user.patronymic"
					type="text"
					value={user.patronymic}
					placeholder="Отчество"
					autoFocus
					disabled={submitting}
				/>
				<label for="user.email">Почта</label>
				<input
					name="user.email"
					type="email"
					value={user.email}
					placeholder="Почта"
					autoFocus
					disabled={submitting}
				/>
				<label for="user.password">Пароль</label>
				<input
					name="user.password"
					type="password"
					value={user.password}
					placeholder="Пароль"
					autoFocus
					disabled={submitting}
				/>
				

				<div style={{ display: 'flex' }}>
					<button
						type="button"
						onClick={onClose}
						disabled={submitting}
					>
						Отмена
					</button>
					<button
						type="submit"
					>
						{submitting ? 'Создание...' : 'Создать'}
					</button>
				</div>
			</form>
		</Modal>
	);
}

export default CreateUserModal;