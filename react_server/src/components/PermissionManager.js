import React, { useState } from 'react';
import './PermissionManager.css';

function PermissionManager({ item, isFile = false }) {
    const [permissions, setPermissions] = useState(item?.permissions || []);
    const [newSubject, setNewSubject] = useState({ type: 'user', id: '', name: '' });

    const permissionTypes = [
        { key: 'read', label: 'Просмотр' },
        { key: 'create', label: 'Создание', hidden: isFile },
        { key: 'update', label: 'Редактирование' },
        { key: 'delete', label: 'Удаление' }
    ];

    const addPermission = () => {
        if (newSubject.id && newSubject.name) {
            setPermissions([...permissions, {
                subjectType: newSubject.type,
                subjectId: newSubject.id,
                subjectName: newSubject.name,
                permissions: { read: false, create: false, update: false, delete: false }
            }]);
            setNewSubject({ type: 'user', id: '', name: '' });
        }
    };

    const updatePermission = (index, permissionKey, value) => {
        const updated = [...permissions];
        if (permissionKey === 'read' && !value) {
            // Если снимаем чтение - снимаем все права
            updated[index].permissions = { read: false, create: false, update: false, delete: false };
        } else {
            updated[index].permissions[permissionKey] = value;
        }
        setPermissions(updated);
    };

    const removePermission = (index) => {
        setPermissions(permissions.filter((_, i) => i !== index));
    };

    return (
        <div className="permission-manager">
            <h3>Управление правами доступа</h3>
            
            <div className="add-permission">
                <h4>Добавить права</h4>
                <div className="subject-selector">
                    <select 
                        value={newSubject.type} 
                        onChange={(e) => setNewSubject({...newSubject, type: e.target.value})}
                    >
                        <option value="user">Пользователь</option>
                        <option value="group">Группа</option>
                    </select>
                    <input
                        type="text"
                        placeholder="ID"
                        value={newSubject.id}
                        onChange={(e) => setNewSubject({...newSubject, id: e.target.value})}
                    />
                    <input
                        type="text"
                        placeholder="Имя"
                        value={newSubject.name}
                        onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    />
                    <button onClick={addPermission}>Добавить</button>
                </div>
            </div>

            <div className="permissions-list">
                <h4>Текущие права</h4>
                {permissions.map((perm, index) => (
                    <div key={index} className="permission-item">
                        <div className="subject-info">
                            <span className="subject-type">{perm.subjectType === 'user' ? '👤' : '👥'}</span>
                            <span className="subject-name">{perm.subjectName}</span>
                            <button 
                                className="remove-btn"
                                onClick={() => removePermission(index)}
                            >×</button>
                        </div>
                        
                        <div className="permission-checkboxes">
                            {permissionTypes
                                .filter(pt => !pt.hidden)
                                .map(pt => (
                                <label key={pt.key} className={!perm.permissions.read && pt.key !== 'read' ? 'disabled' : ''}>
                                    <input
                                        type="checkbox"
                                        checked={perm.permissions[pt.key]}
                                        disabled={!perm.permissions.read && pt.key !== 'read'}
                                        onChange={(e) => updatePermission(index, pt.key, e.target.checked)}
                                    />
                                    {pt.label}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="permission-actions">
                <button className="btn-save">Сохранить права</button>
                <button className="btn-cancel">Отмена</button>
            </div>
        </div>
    );
}

export default PermissionManager;