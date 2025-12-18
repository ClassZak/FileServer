import React, { useState } from 'react';
import Modal from '../Modal';


/**
 * Модальное окно для удаления группы
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Открыто ли модальное окно
 * @param {function} props.onClose - Функция закрытия модального окна
 * @param {function} props.onConfirm - Функция подтверждения формы
 * @param {string} props.authToken - JWT токен для авторизации
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
