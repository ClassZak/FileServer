import React from 'react';
import '../styles/ErrorMessage.css';

import RedirectionButton from './element/RedirectionButton';

const ErrorMessage = ({ 
	message, 
	onClose, 
	showNavigation = false,
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
					<RedirectionButton
						reference={'/files'}
						title={'Перейти в корень'}
						className="error-nav-button error-nav-button--root"
					/>
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