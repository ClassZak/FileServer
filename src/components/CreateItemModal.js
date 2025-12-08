import React, { useState } from 'react';
import '../styles/Modal.css';

function CreateItemModal({ isOpen, onClose, onCreate, parentFolder }) {
    const [itemName, setItemName] = useState('');
    const [itemType, setItemType] = useState('file');
    const [setCustomPermissions, setSetCustomPermissions] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (itemName.trim()) {
            onCreate({
                name: itemName.trim(),
                type: itemType,
                parent: parentFolder,
                customPermissions: setCustomPermissions
            });
            setItemName('');
            setItemType('file');
            setSetCustomPermissions(false);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Создать новый элемент</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Тип:</label>
                        <div className="type-selector">
                            <label>
                                <input
                                    type="radio"
                                    value="file"
                                    checked={itemType === 'file'}
                                    onChange={(e) => setItemType(e.target.value)}
                                />
                                Файл
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="folder"
                                    checked={itemType === 'folder'}
                                    onChange={(e) => setItemType(e.target.value)}
                                />
                                Папка
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Имя:</label>
                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder={`Введите имя ${itemType === 'file' ? 'файла' : 'папки'}`}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={setCustomPermissions}
                                onChange={(e) => setSetCustomPermissions(e.target.checked)}
                            />
                            Настроить особые права доступа
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn-primary">
                            Создать
                        </button>
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateItemModal;