import React from 'react';
import Modal from './modal/Modal';

const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    itemName, 
    onConfirm 
}) => {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Подтверждение удаления"
        >
            <p>
                Вы уверены, что хотите удалить 
                <span>"{itemName}"</span>?
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
};

export default DeleteConfirmationModal;
