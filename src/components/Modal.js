import React, { useEffect, useRef } from 'react';
import '../styles/Modal.css';
import '../styles/global.css';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
    const modalRef = useRef(null);
    
    // Обработка Escape для закрытия
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        if (isOpen) {
            // Блокируем скролл
            document.body.classList.add('modal-open');
            
            // Добавляем обработчик Escape
            document.addEventListener('keydown', handleKeyDown);
            
            return () => {
                // Восстанавливаем скролл
                document.body.classList.remove('modal-open');
                
                // Удаляем обработчик
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, onClose]);
    
    // Не рендерим, если не открыто
    if (!isOpen) return null;
    
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    return (
        <div 
            className="modal-overlay" 
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            <div 
                ref={modalRef}
                className={`modal-content ${className}`}
                // УБИРАЕМ tabIndex, чтобы не перехватывать фокус
            >
                {title && (
                    <h3 
                        id="modal-title"
                        className="text-xl font-semibold mb-4"
                    >
                        {title}
                    </h3>
                )}
                {children}
            </div>
        </div>
    );
};

export default Modal;