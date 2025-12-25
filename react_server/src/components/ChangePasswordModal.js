import { useState,useEffect } from "react";
import Modal from './modal/Modal'

const ChangePasswordModal = ({
    isOpen,
    onClose,
    userEmail,
    onUpdatePassword,
    authToken
}) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    // Валидация пароля
    const validatePassword = (password) => {
        if (!password) return 'Пароль не может быть пустым';
        if (password.length < 6) return 'Пароль должен быть не менее 6 символов';
        return '';
    };

    // Валидация всей формы
    const validateForm = () => {
        const newErrors = {};
        
        const oldPassError = validatePassword(oldPassword);
        if (oldPassError) newErrors.oldPassword = oldPassError;
        
        const newPassError = validatePassword(newPassword);
        if (newPassError) newErrors.newPassword = newPassError;
        
        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Пароли не совпадают';
        }
        
        if (oldPassword && newPassword && oldPassword === newPassword) {
            newErrors.newPassword = 'Новый пароль должен отличаться от старого';
        }
        
        return newErrors;
    };

    // Сброс формы
    const resetForm = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        setSuccessMessage('');
    };

    // При закрытии модального окна
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        
        if (submitting) return;
        
        // Валидация
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        setSubmitting(true);
        setErrors({});
        setSuccessMessage('');
        
        try {
            // Вызываем функцию обновления пароля
            const result = await onUpdatePassword(
                userEmail,
                authToken,
                oldPassword,
                newPassword
            );
            
            if (result && result.success) {
                setSuccessMessage(result.message || 'Пароль успешно изменен');
            } else {
                // Обработка ошибок с сервера
                setErrors({
                    serverError: result?.message || 'Ошибка при изменении пароля'
                });
            }
        } catch (error) {
            console.error('Ошибка при изменении пароля:', error);
            setErrors({
                serverError: 'Произошла ошибка при изменении пароля'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (setter, field) => (e) => {
        setter(e.target.value);
        // Очищаем ошибку при вводе
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
        if (errors.serverError) {
            setErrors(prev => ({
                ...prev,
                serverError: ''
            }));
        }
    };

    // Проверка, можно ли отправить форму
    const isFormValid = () => {
        return oldPassword.trim() && 
               newPassword.trim() && 
               confirmPassword.trim() &&
               !submitting;
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Изменение пароля"
        >
            {successMessage ? (
                <div className="success-message">
                    <p>{successMessage}</p>
                    <p>Модальное окно закроется автоматически...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {errors.serverError && (
                        <div className="error-message" style={{
                            color: 'red',
                            marginBottom: '16px',
                            padding: '8px',
                            backgroundColor: '#ffeeee',
                            borderRadius: '4px'
                        }}>
                            {errors.serverError}
                        </div>
                    )}
                    
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label htmlFor="oldPassword" style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontWeight: '500'
                        }}>
                            Текущий пароль
                        </label>
                        <input
                            id="oldPassword"
                            type="password"
                            value={oldPassword}
                            onChange={handleInputChange(setOldPassword, 'oldPassword')}
                            placeholder="Введите текущий пароль"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: errors.oldPassword ? '1px solid red' : '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                            disabled={submitting}
                            autoFocus
                        />
                        {errors.oldPassword && (
                            <span style={{
                                color: 'red',
                                fontSize: '12px',
                                marginTop: '4px',
                                display: 'block'
                            }}>
                                {errors.oldPassword}
                            </span>
                        )}
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label htmlFor="newPassword" style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontWeight: '500'
                        }}>
                            Новый пароль
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={handleInputChange(setNewPassword, 'newPassword')}
                            placeholder="Введите новый пароль"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: errors.newPassword ? '1px solid red' : '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                            disabled={submitting}
                        />
                        {errors.newPassword && (
                            <span style={{
                                color: 'red',
                                fontSize: '12px',
                                marginTop: '4px',
                                display: 'block'
                            }}>
                                {errors.newPassword}
                            </span>
                        )}
                        <small style={{
                            display: 'block',
                            marginTop: '4px',
                            color: '#666',
                            fontSize: '12px'
                        }}>
                            Минимум 6 символов
                        </small>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label htmlFor="confirmPassword" style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontWeight: '500'
                        }}>
                            Подтверждение пароля
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={handleInputChange(setConfirmPassword, 'confirmPassword')}
                            placeholder="Повторите новый пароль"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: errors.confirmPassword ? '1px solid red' : '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                            disabled={submitting}
                        />
                        {errors.confirmPassword && (
                            <span style={{
                                color: 'red',
                                fontSize: '12px',
                                marginTop: '4px',
                                display: 'block'
                            }}>
                                {errors.confirmPassword}
                            </span>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                color: '#666',
                                background: 'none',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                            disabled={submitting}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '8px 16px',
                                backgroundColor: isFormValid() ? '#007bff' : '#ccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isFormValid() ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                opacity: submitting ? 0.7 : 1
                            }}
                            disabled={!isFormValid() || submitting}
                        >
                            {submitting ? 'Изменение...' : 'Изменить пароль'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default ChangePasswordModal;