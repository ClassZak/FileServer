import React, { useState } from 'react';
import Modal from '../Modal';


/**
 * Modal window for group deleting
 * @param {Object} props
 * @param {boolean} props.isOpen - Is open window
 * @param {function} props.onClose - Modal window closing function
 * @param {function} props.onConfirm - Confirm form function
 */
function DeleteGroupModal({
	isOpen,
	onClose,
	onConfirm,
	name
}) {
	return (
		<Modal 
			isOpen={isOpen} 
			onClose={onClose}
			title="Подтверждение удаления"
		>
			<p>
				Вы уверены, что хотите удалить 
				<span>{`Группу ${name}`}</span>?
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

export default DeleteGroupModal;