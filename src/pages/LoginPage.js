import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';
import Header from '../parts/Header';
import MainContent from '../components/MainContent';
import Footer from '../parts/Footer';

const LoginPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	const from = location.state?.from?.pathname || location.search.replace('?redirect=', '') || '/account';

	useEffect(() => {
		// Если есть токен, проверяем его валидность через сервер
		const checkExistingAuth = async () => {
			if (AuthService.hasToken()) {
				try {
					const result = await AuthService.checkAuth();
					if (result.authenticated) {
						navigate(from, { replace: true });
					}
				} catch (error) {
					// Токен невалиден - остаемся на странице логина
					console.log('Токен недействителен, требуется вход');
				}
			}
		};

		checkExistingAuth();
	}, [navigate, from]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (isSubmitting) return;
		
		setError('');
		setIsSubmitting(true);
		
		try {
			const result = await AuthService.loginByEmail(email, password);
			
			if (result.success) {
				// После успешного логина проверяем авторизацию через сервер
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

	return (
		<div>
			<Header />
			<MainContent>
				<div className="min-h-screen flex items-center justify-center bg-gray-50">
					<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
						<h2 className="text-3xl font-bold text-center">Авторизация</h2>
						<p className="text-center text-gray-600">
							Проверка авторизации выполняется через сервер
						</p>
						
						{error && (
							<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
								{error}
							</div>
						)}
						
						<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Email
								</label>
								<input
									type="email"
									required
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={isSubmitting}
									/>
							</div>
							
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Пароль
								</label>
								<input
									type="password"
									required
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									disabled={isSubmitting}
									/>
							</div>
							
							<button
								type="submit"
								className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
								disabled={isSubmitting}
								>
								{isSubmitting ? 'Вход...' : 'Войти'}
							</button>
						</form>
					</div>
				</div>
			</MainContent>
			<Footer />
		</div>
	);
};

export default LoginPage;








/*<div>
			<Header />
			<MainContent>
				<div className="min-h-screen flex items-center justify-center bg-gray-50">
					<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
						<h2 className="text-3xl font-bold text-center">Авторизация</h2>
						<p className="text-center text-gray-600">
							Проверка авторизации выполняется через сервер
						</p>
						
						{error && (
							<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
								{error}
							</div>
						)}
						
						<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Email
								</label>
								<input
									type="email"
									required
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
							
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Пароль
								</label>
								<input
									type="password"
									required
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
							
							<button
								type="submit"
								className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
								disabled={isSubmitting}
							>
								{isSubmitting ? 'Вход...' : 'Войти'}
							</button>
						</form>
					</div>
				</div>
			</MainContent>
			<Footer />
		</div> */