import axios from 'axios';

export class FileService{
	static async exists(file, token){
		try {
            const response = await axios.get(`/api/files/exists?path=${file}`,{
				headers: { 'Authorization': `Bearer ${token}`
			}});
            
			return response.data.exists;
        } catch (error) {
            console.error('Login error:', error);
			return false;
        }
	}
}