import React, { use, useState } from 'react';
import Modal from '../Modal';
import User from '../../../entity/User';


/**
 * Modal window for add user to group
 * @param {Object} props
 * @param {boolean} props.isOpen - Is open window
 * @param {function} props.onClose - Modal window closing function
 * @param {function} props.onConfirm - Confirm form function
 * @param {string} props.authToken - JWT token
 */
function AddUserToGroupModal({
	isOpen,
	onClose,
	onConfirm,
	name,
	user
}){
	return (
		<Modal 
			isOpen={isOpen} 
			onClose={onClose}
			title="Подтверждение добавления в группу"
		>
			<p>
				Вы уверены, что хотите добавить
				<span>{`Пользователя "${user}" в группу ${name}`}</span>?
			</p>
			<p>
				Это действие нельзя отменить.
			</p>
			<div className="flex">
				<button
					type="button"
					onClick={onClose}
				>
					Отмена
				</button>
				<button
					type="button"
					onClick={onConfirm}
				>
					Добавить
				</button>
			</div>
		</Modal>
	);
}

export default AddUserToGroupModal;