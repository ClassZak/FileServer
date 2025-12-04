// components/DeleteConfirmationModal.jsx
import React from 'react';
import Modal from './Modal';

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
            <p className="mb-6 text-gray-700">
                Вы уверены, что хотите удалить 
                <span className="font-semibold text-red-600"> "{itemName}"</span>?
            </p>
            <p className="mb-6 text-sm text-gray-500">
                Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                    Отмена
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Удалить
                </button>
            </div>
        </Modal>
    );
};

export default DeleteConfirmationModal;