import React, { useState } from 'react';
import Modal from '../Modal';

function DeleteUserPasswordModal({
	isOpen,
	onClose,
	onConfirm,
    email
}) {
	return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Подтверждение удаления"
        >
            <p>
                Вы уверены, что хотите удалить 
                <span>{`Пользователя с почтой ${email}`}</span>?
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

export default DeleteUserPasswordModal;
