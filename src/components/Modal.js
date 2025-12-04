// components/Modal.jsx
import React, { useEffect } from 'react';
import '../styles/Modal.css';
import '../styles/global.css';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
    useEffect(() => {
        if (isOpen) {
            // Рассчитываем ширину скроллбара
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
            document.body.classList.add('modal-open');
            
            // Блокируем клавишу Tab для фокуса вне модального окна
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
                if (e.key === 'Tab') {
                    const focusableElements = document.querySelectorAll(
                        '.modal-content button, .modal-content input, .modal-content textarea, .modal-content select'
                    );
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            };
            
            document.addEventListener('keydown', handleKeyDown);
            
            // Фокусируемся на первом фокусируемом элементе при открытии
            setTimeout(() => {
                const focusableElements = document.querySelectorAll(
                    '.modal-content button, .modal-content input, .modal-content textarea, .modal-content select'
                );
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            }, 100);
            
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            document.body.classList.remove('modal-open');
        }
        
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Закрытие по клику на оверлей
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={`modal-content ${className}`}>
                {title && (
                    <h3 className="text-xl font-semibold mb-4">{title}</h3>
                )}
                {children}
            </div>
        </div>
    );
};

export default Modal;