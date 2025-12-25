import React, { use, useState } from 'react';
import Modal from '../Modal';
import User from '../../../entity/User';


/**
 * Modal window for add user to group
 * @param {Object} props
 * @param {boolean} props.isOpen - Is open window
 * @param {function} props.onClose - Modal window closing function
 * @param {function} props.onConfirm - Confirm form function
 * @param {User} props.name - Name of group
 * @param {User} props.user - User for renove
 */
function RemoveUserFromGroupModal({
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
			title="Подтверждение удаления из группы"
		>
			<p>
				Вы уверены, что хотите удалить
				<span>{`Пользователя "${user}" из группы ${name}`}</span>?
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
					Удалить
				</button>
			</div>
		</Modal>
	);
}

export default RemoveUserFromGroupModal;