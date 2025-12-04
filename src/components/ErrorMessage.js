// components/ErrorMessage.jsx
import React from 'react';
import '../styles/ErrorMessage.css';

const ErrorMessage = ({ 
    message, 
    onClose, 
    showNavigation = false,
    onNavigateToRoot,
    onNavigateUp,
    showUpButton = false
}) => {
    if (!message) return null;

    return (
        <div className="error-message">
            <div className="error-message-content">
                <div className="error-message-text">
                    {message}
                </div>
                <button
                    onClick={onClose}
                    className="error-close-button"
                    type="button"
                    aria-label="Закрыть сообщение об ошибке"
                >
                    ✕
                </button>
            </div>
            {showNavigation && (message.includes('не найдена') || message.includes('нет прав')) && (
                <div className="error-navigation">
                    <button
                        onClick={onNavigateToRoot}
                        className="error-nav-button error-nav-button--root"
                        type="button"
                    >
                        Перейти в корень
                    </button>
                    {showUpButton && (
                        <button
                            onClick={onNavigateUp}
                            className="error-nav-button error-nav-button--up"
                            type="button"
                        >
                            На уровень выше
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ErrorMessage;