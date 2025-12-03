import axios from 'axios';

class AuthService {
	static async loginByEmail(email, password) {
		try {
			const response = await axios.post('/api/auth/login', {
                email,
                password
            });
			
			if (response.data.token) {
				localStorage.setItem('token', response.data.token);
				localStorage.setItem('refreshToken', response.data.refreshToken);
				return {
					success: true,
					token: response.data.token,
					user: response.data.user
				};
			}
		} catch (error) {
			console.error('Login error:', error);
			return {
				success: false,
				message: error.response?.data?.message || 'Ошибка входа'
			};
		}
	}

	static logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('refreshToken');
		axios.post('/api/auth/logout');
	}

	static async checkAuth() {
		try {
			const token = localStorage.getItem('token');
			const response = await axios.get('/api/auth/check-auth', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			return response.data;
		} catch (error) {
			console.error('Check auth error:', error);
			return {
				authenticated: false,
				message: error.response?.data?.message || 'Ошибка проверки аутентификации'
			};
		}
	}

	static getToken() {
		return localStorage.getItem('token');
	}

	static isAuthenticated() {
		return !!localStorage.getItem('token');
	}

	static setToken(token) {
		localStorage.setItem('token', token);
	}
}

export default AuthService;