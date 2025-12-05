// pages/FilesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainContent from "../components/MainContent";
import AuthService from "../services/AuthService";
import { FileService } from '../services/FileService';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import FileSearch from '../components/FileSearch'

import '../styles/SearchResults.css'
// Импортируем новые компоненты
import Breadcrumbs from '../components/Breadcrumbs';
import ErrorMessage from '../components/ErrorMessage';
import FileTable from '../components/FileTable';
import FolderTable from '../components/FolderTable';
import CreateFolderModal from '../components/CreateFolderModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const FilesPage = () => {
    const { '*': pathParam } = useParams();
    const navigate = useNavigate();
    
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [pathInput, setPathInput] = useState('');

    const currentPath = pathParam || '';

    const location = useLocation();

    // Получаем параметры поиска
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('q');
    const searchPath = searchParams.get('searchPath') || '';

    // Определяем режим
    const isSearchMode = Boolean(searchQuery);

    // Состояния для поиска
    const [searchResults, setSearchResults] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);

    // Добавить в useEffect:
    useEffect(() => {
        if (isSearchMode) {
            // Режим поиска
            performSearch(searchQuery, searchPath);
        } else {
            // Обычный режим
            loadDirectory(currentPath);
        }
    }, [location.search, pathParam]); // Следим за изменениями URL

    // Функция для выполнения поиска
    const performSearch = async (query, path) => {
        setSearchLoading(true);
        try {
            const token = AuthService.getToken();
            const results = await FileService.find(query, path, token);
            setSearchResults(results);
        } catch (err) {
            setError('Ошибка при выполнении поиска');
            console.error('Search error:', err);
        } finally {
            setSearchLoading(false);
        }
    };

    // Выйти из режима поиска
    const exitSearchMode = () => {
        navigate(`/files/${currentPath}`);
    };

    // Загрузка списка файлов
    const loadDirectory = async (path = '') => {
        setLoading(true);
        setError('');
        
        try {
            const token = AuthService.getToken();
            const response = await axios.get(`/api/files/list?path=${encodeURIComponent(path)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setFiles(response.data.files || []);
            setFolders(response.data.folders || []);
            setPathInput(path || '');
        } catch (err) {
            const errorData = err.response?.data;
            
            if (errorData?.error) {
                setError(errorData.error);
            } else if (err.response?.status === 400) {
                setError('Директория не найдена');
            } else if (err.response?.status === 403) {
                setError('У вас нет прав доступа к этой директории');
            } else if (err.response?.status === 401) {
                setError('Требуется авторизация');
                navigate('/login');
                return;
            } else if (err.response?.status === 404) {
                setError('Директория не найдена');
            } else {
                setError('Ошибка при загрузке файлов');
            }
            
            console.error('Load directory error:', err);
            
            setFiles([]);
            setFolders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDirectory(currentPath);
    }, [currentPath]);

    useEffect(() => {
        setPathInput(currentPath || '');
    }, [currentPath]);

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

    const navigateToRoot = () => {
        setError('');
        navigate('/files');
    };

    const handlePathInputChange = (e) => {
        setPathInput(e.target.value);
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
            
            setShowCreateFolderModal(false);
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

    const prepareDelete = (path, name) => {
        setItemToDelete({ path, name });
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        
        try {
            const token = AuthService.getToken();
            await axios.delete('/api/files/delete', {
                data: { path: itemToDelete.path },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setShowDeleteModal(false);
            setItemToDelete(null);
            loadDirectory(currentPath);
        } catch (err) {
            const errorData = err.response?.data;
            
            if (errorData?.error) {
                setError(errorData.error);
            } else if (err.response?.status === 403) {
                setError('У вас нет прав на удаление');
            } else if (err.response?.status === 404) {
                setError('Файл или папка не найдены');
            } else {
                setError('Ошибка при удалении');
            }
            
            console.error('Delete error:', err);
        }
    };

    const handleDownload = async (path, name) => {
        try {
            const token = AuthService.getToken();
            const response = await axios.get(`/api/files/download?path=${encodeURIComponent(path)}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const contentType = response.headers['content-type'];
            if (contentType && contentType.includes('application/json')) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        setError(errorData.error || 'Ошибка при скачивании файла');
                    } catch (e) {
                        setError('Ошибка при скачивании файла');
                    }
                };
                reader.readAsText(response.data);
                return;
            }
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            const errorData = err.response?.data;
            
            if (errorData?.error) {
                setError(errorData.error);
            } else if (err.response?.status === 403) {
                setError('У вас нет прав на скачивание этого файла');
            } else if (err.response?.status === 404) {
                setError('Файл не найден');
            } else {
                setError('Ошибка при скачивании файла');
            }
            
            console.error('Download error:', err);
        }
    };

    return (
        <MainContent>
    <div className="container mx-auto px-4 py-8">
        {isSearchMode ? (
    // 1. РЕЖИМ ПОИСКА - новый код
    <>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex justify-between items-center">
                <div>
                    <span className="font-medium">Режим поиска:</span>
                    <span className="ml-2">
                        "{searchQuery}" в {searchPath || 'корневой папке'}
                    </span>
                </div>
                <button
                    onClick={exitSearchMode}
                    className="px-3 py-1 text-sm bg-white border border-blue-300 rounded hover:bg-blue-50"
                >
                    Выйти из поиска
                </button>
            </div>
        </div>

        {/* Рендерим результаты поиска здесь */}
        <div className="search-results">
            {searchLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Выполняется поиск...</p>
                </div>
            ) : error ? (
                <ErrorMessage 
                    message={error}
                    onClose={() => setError('')}
                    showNavigation={true}
                    onNavigateToRoot={navigateToRoot}
                    onNavigateUp={navigateUp}
                    showUpButton={!!searchPath}
                />
            ) : searchResults ? (
                <>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-2">
                            Результаты поиска
                        </h2>
                        <div className="text-gray-600 mb-4">
                            <p>По запросу <span className="font-medium">"{searchQuery}"</span></p>
                            <p>В папке: <span className="font-medium">{searchPath || 'корневая'}</span></p>
                            <p>Найдено результатов: <span className="font-medium">{searchResults.totalResults}</span></p>
                        </div>
                    </div>
                    
                    {searchResults.totalResults > 0 ? (
                        <>
                            {/* ПАПКИ В РЕЖИМЕ ПОИСКА - ТАБЛИЦА */}
                            {searchResults.folders && searchResults.folders.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                                        <span className="mr-2">📁</span> 
                                        Найденные папки ({searchResults.folders.length})
                                    </h3>
                                    
                                    <table className="file-table">
                                        <thead>
                                            <tr>
                                                <th>Имя папки</th>
                                                <th>Полный путь</th>
                                                <th>Размер</th>
                                                <th>Элементов</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {searchResults.folders.map((folder, index) => {
                                                const folderFullPath = folder.fullPath || 
                                                                      (searchPath ? `${searchPath}/${folder.name}` : folder.name);
                                                
                                                return (
                                                    <tr key={`folder-${index}`}>
                                                        <td>
                                                            <div 
                                                                className="flex items-center cursor-pointer hover:text-blue-400"
                                                                onClick={() => navigate(`/files/${folderFullPath}`)}
                                                            >
                                                                <div className="mr-3 text-xl">📁</div>
                                                                <div className="font-medium">
                                                                    {folder.name}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-sm text-gray-400">
                                                            {folderFullPath}
                                                        </td>
                                                        <td>{folder.readableSize || ''}</td>
                                                        <td>{folder.itemCount !== undefined ? `${folder.itemCount} элемент(ов)` : ''}</td>
                                                        <td>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => navigate(`/files/${folderFullPath}`)}
                                                                    className="file-action-button file-action-button--download"
                                                                >
                                                                    Открыть
                                                                </button>
                                                                <button
                                                                    onClick={() => prepareDelete(folderFullPath, folder.name)}
                                                                    className="file-action-button file-action-button--delete"
                                                                >
                                                                    Удалить
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            
                            {/* ФАЙЛЫ В РЕЖИМЕ ПОИСКА - ТАБЛИЦА */}
                            {searchResults.files && searchResults.files.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                                        <span className="mr-2">📄</span> 
                                        Найденные файлы ({searchResults.files.length})
                                    </h3>
                                    
                                    <table className="file-table">
                                        <thead>
                                            <tr>
                                                <th>Имя файла</th>
                                                <th>Полный путь</th>
                                                <th>Размер</th>
                                                <th>Расширение</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {searchResults.files.map((file, index) => {
                                                const fileFullPath = file.fullPath || 
                                                                   (searchPath ? `${searchPath}/${file.name}` : file.name);
                                                const fileExtension = file.extension || 
                                                                     (file.name.includes('.') ? file.name.split('.').pop() : '');
                                                    
                                                return (
                                                    <tr key={`file-${index}`}>
                                                        <td>
                                                            <div className="flex items-center">
                                                                <div className="text-xl mr-3">📄</div>
                                                                <div className="font-medium">
                                                                    {file.name}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-sm text-gray-400">
                                                            {fileFullPath}
                                                        </td>
                                                        <td>{file.readableSize || 'N/A'}</td>
                                                        <td>
                                                            {fileExtension ? (
                                                                <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                                                                    {fileExtension.toUpperCase()}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                        <td>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleDownload(fileFullPath, file.name)}
                                                                    className="file-action-button file-action-button--download"
                                                                >
                                                                    Скачать
                                                                </button>
                                                                <button
                                                                    onClick={() => prepareDelete(fileFullPath, file.name)}
                                                                    className="file-action-button file-action-button--delete"
                                                                >
                                                                    Удалить
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Ничего не найдено
                            </h3>
                            <p className="text-gray-500">
                                По запросу "{searchQuery}" в папке "{searchPath || 'корневая'}" ничего не найдено
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={exitSearchMode}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Вернуться к просмотру файлов
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    </>
) : (
            // 2. ОБЫЧНЫЙ РЕЖИМ НАВИГАЦИИ - ТВОЙ СТАРЫЙ КОД (вставляем сюда)
            <>
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
                                    placeholder="Введите путь (например: documents/images)"
                                />
                                <button
                                    type="submit"
                                >
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
                                onClick={() => setShowCreateFolderModal(true)}
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
                
                {/* Сообщение об ошибке */}
                <ErrorMessage 
                    message={error}
                    onClose={() => setError('')}
                    showNavigation={true}
                    onNavigateToRoot={navigateToRoot}
                    onNavigateUp={navigateUp}
                    showUpButton={!!currentPath}
                />
                
                {/* Загрузка */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Загрузка файлов...</p>
                    </div>
                )}
                
                {/* Список папок и файлов */}
                {!loading && (
    <>
        <FolderTable 
            folders={folders}
            navigateToFolder={navigateToFolder}
            prepareDelete={prepareDelete}
        />
        <FileTable 
            files={files}
            onDownload={handleDownload}
            onDelete={prepareDelete}
        />
    </>
)}
                
                {/* Модальные окна */}
                <CreateFolderModal 
                    isOpen={showCreateFolderModal}
                    onClose={() => setShowCreateFolderModal(false)}
                    currentPath={currentPath}
                    onCreate={handleCreateFolder}
                />
                
                <DeleteConfirmationModal 
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setItemToDelete(null);
                    }}
                    itemName={itemToDelete?.name}
                    onConfirm={handleDelete}
                />
            </>
        )}
    </div>
</MainContent>
    );

};

export default FilesPage;