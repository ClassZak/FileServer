// components/CreateFolderModal.jsx
import React, { useState } from 'react';
import Modal from './Modal';

const CreateFolderModal = ({ 
    isOpen, 
    onClose, 
    currentPath, 
    onCreate 
}) => {
    const [folderName, setFolderName] = useState('');

    const handleSubmit = (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        onCreate(folderName);
        setFolderName('');
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Создать новую папку"
        >
            <p className="text-gray-600 mb-4">
                Текущий путь: <span className="font-medium">{currentPath || '/'}</span>
            </p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Введите имя папки"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                    autoFocus
                />
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Создать
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateFolderModal;