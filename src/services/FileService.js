import axios from 'axios';
import AuthService from './AuthService';

export class FileService {
    static async exists(file, token) {
        try {
            const response = await axios.get(`/api/files/exists?path=${file}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data.exists;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }
    
    // Метод для поиска файлов и папок (ВАРИАНТ 1)
    static async find(query, path = '', token) {
        try {
            const response = await axios.get(
                `/api/files/search?q=${encodeURIComponent(query)}&path=${encodeURIComponent(path)}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }
}