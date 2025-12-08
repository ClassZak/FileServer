import React, { useEffect, useRef, useCallback } from 'react';
import '../styles/Modal.css';
import '../styles/global.css';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
    const modalRef = useRef(null);
    const previouslyFocusedElement = useRef(null);
    
    // Мемоизируем обработчик Escape
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
        if (e.key === 'Tab') {
            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (!focusableElements || focusableElements.length === 0) return;
            
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
    }, [onClose]);
    
    // Эффект для управления состоянием модального окна
    useEffect(() => {
        if (isOpen) {
            // Сохраняем элемент, который был в фокусе до открытия модального окна
            previouslyFocusedElement.current = document.activeElement;
            
            // Рассчитываем ширину скроллбара
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
            
            // Блокируем скролл
            document.body.classList.add('modal-open');
            
            // Добавляем обработчик клавиш
            document.addEventListener('keydown', handleKeyDown);
            
            // Фокус на модальном окне
            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements && focusableElements.length > 0) {
                focusableElements[0].focus();
            } else {
                modalRef.current?.focus();
            }
            
            return () => {
                // Восстанавливаем скролл
                document.body.classList.remove('modal-open');
                document.documentElement.style.removeProperty('--scrollbar-width');
                
                // Удаляем обработчик клавиш
                document.removeEventListener('keydown', handleKeyDown);
                
                // Возвращаем фокус на предыдущий элемент
                if (previouslyFocusedElement.current) {
                    previouslyFocusedElement.current.focus();
                }
            };
        }
    }, [isOpen, handleKeyDown]); // Добавляем handleKeyDown в зависимости
    
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
                tabIndex={-1}
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