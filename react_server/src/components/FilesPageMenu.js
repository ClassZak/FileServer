import React, { useState, useEffect, use } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import AuthService from "../services/AuthService";
import { FileService } from '../services/FileService';
import Breadcrumbs from '../components/Breadcrumbs';
import FileSearch from '../components/FileSearch'

function FilesPageMenu({ currentPath, openCreateFolderModal, loadDirectory }){
	const [uploading, setUploading] = useState(false);
	const [files, setFiles] = useState([]);
	const [folders, setFolders] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	let pathInput = currentPath || '';

	const handlePathInputChange = (e) => {
        //setPathInput(e.target.value);
		//pathInput = e.token.value;
    };

	const navigateToFolder = (folderPath) => {
        setError('');
        navigate(`/files/${folderPath}`);
    };

	const navigateUp = () => {
        if (currentPath) {
            setError('');
            const parts = currentPath.split('/');
            parts.pop();
            const parentPath = parts.join('/');
            navigate(`/files/${parentPath}`);
        }
    };

	const handlePathSubmit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        setError('');
        if (pathInput.trim() === '') {
			navigate('/files');
        } else {
			const cleanPath = pathInput.replace(/^\/+|\/+$/g, '');
			const token = AuthService.getToken();
			const exists = await FileService.exists(cleanPath,token);
			if(exists)
                navigate(`/files/${cleanPath}`);
        }
    };
	
    const handlePathInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handlePathSubmit();
        }
    };

	const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        setUploading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const token = AuthService.getToken();
            await axios.post(`/api/files/upload?path=${encodeURIComponent(currentPath)}`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            loadDirectory(currentPath);
        } catch (err) {
            const errorData = err.response?.data;
            
            if (errorData?.error) {
                setError(errorData.error);
            } else if (err.response?.status === 403) {
                setError('У вас нет прав на загрузку файлов в эту директорию');
            } else if (err.response?.status === 400) {
                setError('Ошибка при загрузке файла: ' + (errorData?.error || 'неизвестная ошибка'));
            } else {
                setError('Ошибка при загрузке файла');
            }
            
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

	const handleCreateFolder = async (folderName) => {
        try {
            const token = AuthService.getToken();
            await axios.post('/api/files/create-folder', {
                path: currentPath,
                folderName: folderName.trim()
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            openCreateFolderModal();
            loadDirectory(currentPath);
        } catch (err) {
            const errorData = err.response?.data;
            
            if (errorData?.error) {
                setError(errorData.error);
            } else if (err.response?.status === 403) {
                setError('У вас нет прав на создание папок в этой директории');
            } else {
                setError('Ошибка при создании папки');
            }
            
            console.error('Create folder error:', err);
        }
    };
	


	return (
		<div>
			<div className="mb-6">
				<h1 className="text-3xl font-bold mb-2">Файловый менеджер</h1>
				<Breadcrumbs 
					currentPath={currentPath} 
					onNavigate={navigateToFolder} 
				/>
			</div>
			
			{/* Панель навигации */}
			<div className="mb-6 bg-gray-50 p-4 rounded-lg">
				<div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
					<div className="flex-1">
						<form onSubmit={handlePathSubmit} className="flex">
							<input
								type="text"
								value={pathInput}
								onChange={handlePathInputChange}
								onKeyDown={handlePathInputKeyDown}
								placeholder="Введите путь..."
							/>
							<button type="submit">
								Перейти
							</button>
						</form>
					</div>
					
					<div className="flex flex-wrap gap-2">
						<FileSearch currentPath={currentPath} />
						<button
							onClick={navigateUp}
							disabled={!currentPath}
							className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
							type="button"
						>
							Назад
						</button>
						
						<button
							onClick={() => openCreateFolderModal()}
							className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
							type="button"
						>
							Создать папку
						</button>
						
						<label className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
							{uploading ? 'Загрузка...' : 'Загрузить файл'}
							<input
								type="file"
								className="hidden"
								onChange={handleFileUpload}
								disabled={uploading}
							/>
						</label>
					</div>
				</div>
				
				<div className="mt-2 text-sm text-gray-600">
					<span className="font-medium">Текущий путь:</span> {currentPath || '/'}
				</div>
			</div>
		</div>
	);
}

export default FilesPageMenu;