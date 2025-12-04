import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';
import MainContent from '../components/MainContent';


const LoginPage = () => {
	// Состояние для выбора типа входа
	const [loginType, setLoginType] = useState('email'); // 'email' или 'snp'
	
	// Поля для входа по email
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	
	// Поля для входа по ФИО
	const [surname, setSurname] = useState('');
	const [name, setName] = useState('');
	const [patronymic, setPatronymic] = useState('');
	const [snpPassword, setSnpPassword] = useState('');
	
	// Общие состояния
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	// Определяем URL для редиректа после успешного входа
	const from = location.state?.from?.pathname || 
				location.search.replace('?redirect=', '') || 
				'/account';

	// Проверяем существующую авторизацию
	useEffect(() => {
		const checkExistingAuth = async () => {
			if (AuthService.hasToken()) {
				try {
					const result = await AuthService.checkAuth();
					if (result.authenticated) {
						navigate(from, { replace: true });
					}
				} catch (error) {
					console.log('Токен недействителен, требуется вход');
				}
			}
		};

		checkExistingAuth();
	}, [navigate, from]);

	// Обработчик входа по email
	const handleEmailLogin = async (e) => {
		e.preventDefault();
		
		if (isSubmitting) return;
		
		setError('');
		setIsSubmitting(true);
		
		try {
			const result = await AuthService.loginByEmail(email, password);
			
			if (result.success) {
				// Проверяем авторизацию через сервер
				const authResult = await AuthService.checkAuth();
				
				if (authResult.authenticated) {
					navigate(from, { replace: true });
				} else {
					setError('Ошибка авторизации после входа');
				}
			} else {
				setError(result.message || 'Ошибка входа');
			}
		} catch (err) {
			console.error('Login failed:', err);
			setError('Ошибка сети или сервера');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Обработчик входа по ФИО
	const handleSnpLogin = async (e) => {
		e.preventDefault();
		
		if (isSubmitting) return;
		
		setError('');
		setIsSubmitting(true);
		
		try {
			const result = await AuthService.loginBySnp(surname, name, patronymic, snpPassword);
			
			if (result.success) {
				// Проверяем авторизацию через сервер
				const authResult = await AuthService.checkAuth();
				
				if (authResult.authenticated) {
					navigate(from, { replace: true });
				} else {
					setError('Ошибка авторизации после входа');
				}
			} else {
				setError(result.message || 'Ошибка входа');
			}
		} catch (err) {
			console.error('Login by SNP failed:', err);
			setError('Ошибка сети или сервера');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Сброс полей при переключении типа входа
	const switchLoginType = (type) => {
		setLoginType(type);
		setError('');
		// Сбрасываем пароли при переключении
		setPassword('');
		setSnpPassword('');
	};

	return (
		<MainContent>
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
				<div className="max-w-lg w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
					<div className="text-center">
						<h2 className="text-3xl font-bold text-gray-800">Авторизация</h2>
						<p className="mt-2 text-gray-600">
							Выберите способ входа в систему
						</p>
					</div>

					{/* Переключатель типа входа */}
					<div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
						<button
							type="button"
							className={`flex-1 py-3 px-4 text-center font-medium rounded-md transition-all ${
								loginType === 'email' 
									? 'bg-white text-blue-600 shadow-sm' 
									: 'text-gray-600 hover:text-gray-900'
							}`}
							onClick={() => switchLoginType('email')}
							disabled={isSubmitting}
						>
							По Email
						</button>
						<button
							type="button"
							className={`flex-1 py-3 px-4 text-center font-medium rounded-md transition-all ${
								loginType === 'snp' 
									? 'bg-white text-blue-600 shadow-sm' 
									: 'text-gray-600 hover:text-gray-900'
							}`}
							onClick={() => switchLoginType('snp')}
							disabled={isSubmitting}
						>
							По ФИО
						</button>
					</div>

					{/* Сообщения об ошибках */}
					{error && (
						<div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
							<div className="flex">
								<div className="flex-shrink-0">
									<svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm text-red-700">{error}</p>
								</div>
							</div>
						</div>
					)}

					{/* Форма для входа по Email */}
					{loginType === 'email' && (
						<form className="space-y-6" onSubmit={handleEmailLogin}>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Email адрес
									</label>
									<input
										type="email"
										required
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
										placeholder="example@mail.ru"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Пароль
									</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12"
											placeholder="Введите пароль"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											disabled={isSubmitting}
										/>
										<button
											type="button"
											className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
											onClick={() => setShowPassword(!showPassword)}
											disabled={isSubmitting}
										>
											{showPassword ? 'Скрыть' : 'Показать'}
										</button>
									</div>
								</div>
							</div>

							<button
								type="submit"
								className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<span className="flex items-center justify-center">
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Вход...
									</span>
								) : (
									'Войти через Email'
								)}
							</button>
						</form>
					)}

					{/* Форма для входа по ФИО */}
					{loginType === 'snp' && (
						<form className="space-y-6" onSubmit={handleSnpLogin}>
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Фамилия
										</label>
										<input
											type="text"
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
											placeholder="Иванов"
											value={surname}
											onChange={(e) => setSurname(e.target.value)}
											disabled={isSubmitting}
										/>
									</div>
									
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Имя
										</label>
										<input
											type="text"
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
											placeholder="Иван"
											value={name}
											onChange={(e) => setName(e.target.value)}
											disabled={isSubmitting}
										/>
									</div>
									
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Отчество
										</label>
										<input
											type="text"
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
											placeholder="Иванович"
											value={patronymic}
											onChange={(e) => setPatronymic(e.target.value)}
											disabled={isSubmitting}
										/>
									</div>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Пароль
									</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12"
											placeholder="Введите пароль"
											value={snpPassword}
											onChange={(e) => setSnpPassword(e.target.value)}
											disabled={isSubmitting}
										/>
										<button
											type="button"
											className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
											onClick={() => setShowPassword(!showPassword)}
											disabled={isSubmitting}
										>
											{showPassword ? 'Скрыть' : 'Показать'}
										</button>
									</div>
								</div>
							</div>

							<button
								type="submit"
								className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<span className="flex items-center justify-center">
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Вход...
									</span>
								) : (
									'Войти по ФИО'
								)}
							</button>
						</form>
					)}

					{/* Дополнительная информация */}
					<div className="text-center text-sm text-gray-500 pt-4 border-t">
						<p>Для входа используйте email или ФИО с паролем</p>
						<p className="mt-1">Все запросы проверяются через сервер</p>
					</div>
				</div>
			</div>
		</MainContent>
	);
};

export default LoginPage;