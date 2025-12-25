function LoadingSpinner( {title} ) {
	return (
		<div style={{
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			minHeight: '300px',
			padding: '40px'
		}}>
			{/* Простой спиннер */}
			<div style={{
				width: '50px',
				height: '50px',
				border: '5px solid #f3f3f3',
				borderTop: '5px solid #3498db',
				borderRadius: '50%',
				animation: 'spin 1s linear infinite',
				marginBottom: '20px'
			}}></div>
			
			{/* Текст с точками для анимации */}
			<div style={{
				fontSize: '18px',
				fontWeight: '500',
				color: '#333'
			}}>
				{title}
				<span style={{
					animation: 'dots 1.5s steps(4, end) infinite'
				}}>...</span>
			</div>
			
			{/* Инлайн стили для анимаций */}
			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
					}
					@keyframes dots {
						0%, 20% { content: ''; }
						40% { content: '.'; }
						60% { content: '..'; }
						80%, 100% { content: '...'; }
						}
						`}</style>
		</div>
	);
}

export default LoadingSpinner;