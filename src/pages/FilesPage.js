import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from "../parts/Header";
import MainContent from "../components/MainContent";
import Footer from "../parts/Footer";
import AuthService from "../services/AuthService";

const FilesPage = () => {
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

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
            setCurrentPath(response.data.path || '');
        } catch (err) {
            setError('Ошибка при загрузке файлов');
            console.error('Load directory error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Инициализация
    useEffect(() => {
        loadDirectory();
    }, []);

    // Навигация по папкам
    const navigateToFolder = (folderPath) => {
        loadDirectory(folderPath);
    };

    // Назад
    const navigateUp = () => {
        if (currentPath) {
            const parts = currentPath.split('/');
            parts.pop();
            const parentPath = parts.join('/');
            loadDirectory(parentPath);
        }
    };

    // Загрузка файла
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
            
            // Обновляем список
            loadDirectory(currentPath);
        } catch (err) {
            setError('Ошибка при загрузке файла');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
            event.target.value = ''; // Сброс input
        }
    };

    // Открыть модалку создания папки
    const openCreateFolderModal = () => {
        setNewFolderName('');
        setShowCreateFolderModal(true);
    };

    // Создание папки
    const createFolder = async () => {
        if (!newFolderName.trim()) {
            setError('Имя папки не может быть пустым');
            return;
        }
        
        try {
            const token = AuthService.getToken();
            await axios.post('/api/files/create-folder', {
                path: currentPath,
                folderName: newFolderName.trim()
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setShowCreateFolderModal(false);
            loadDirectory(currentPath);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при создании папки');
            console.error('Create folder error:', err);
        }
    };

    // Подготовка к удалению
    const prepareDelete = (path, name) => {
        setItemToDelete({ path, name });
        setShowDeleteModal(true);
    };

    // Удаление
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
            setError('Ошибка при удалении');
            console.error('Delete error:', err);
        }
    };

    // Скачивание
    const handleDownload = async (path, name) => {
        try {
            const token = AuthService.getToken();
            const response = await axios.get(`/api/files/download?path=${encodeURIComponent(path)}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });
            
            // Создаем ссылку для скачивания
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Ошибка при скачивании файла');
            console.error('Download error:', err);
        }
    };

    return (
        <div>
            <Header />
            <MainContent>
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Файловый менеджер</h1>
                    
                    {/* Панель навигации */}
                    <div className="mb-6 flex items-center space-x-4">
                        <button
                            onClick={navigateUp}
                            disabled={!currentPath}
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                            Назад
                        </button>
                        
                        <span className="text-gray-600">
                            Текущий путь: {currentPath || '/'}
                        </span>
                        
                        <button
                            onClick={openCreateFolderModal}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
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
                    
                    {/* Сообщения об ошибках */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                    
                    {/* Загрузка */}
                    {loading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    )}
                    
                    {/* Список папок */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Папки</h2>
                        {folders.length === 0 ? (
                            <p className="text-gray-500">Папок нет</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {folders.map(folder => (
                                    <div key={folder.path} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-center">
                                            <button
                                                onClick={() => navigateToFolder(folder.path)}
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                📁 {folder.name}
                                            </button>
                                            <button
                                                onClick={() => prepareDelete(folder.path, folder.name)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <div>Элементов: {folder.itemCount}</div>
                                            <div>Размер: {folder.readableSize}</div>
                                            <div>Изменен: {new Date(folder.lastModified).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Список файлов */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Файлы</h2>
                        {files.length === 0 ? (
                            <p className="text-gray-500">Файлов нет</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="py-2 px-4 border text-left">Имя</th>
                                            <th className="py-2 px-4 border text-left">Размер</th>
                                            <th className="py-2 px-4 border text-left">Тип</th>
                                            <th className="py-2 px-4 border text-left">Изменен</th>
                                            <th className="py-2 px-4 border text-left">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {files.map(file => (
                                            <tr key={file.path} className="hover:bg-gray-50">
                                                <td className="py-2 px-4 border">
                                                    <span className="font-medium">{file.name}</span>
                                                </td>
                                                <td className="py-2 px-4 border">{file.readableSize}</td>
                                                <td className="py-2 px-4 border">
                                                    <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                                                        {file.extension || 'файл'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4 border">
                                                    {new Date(file.lastModified).toLocaleString()}
                                                </td>
                                                <td className="py-2 px-4 border">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleDownload(file.path, file.name)}
                                                            className="text-blue-500 hover:text-blue-700"
                                                        >
                                                            Скачать
                                                        </button>
                                                        <button
                                                            onClick={() => prepareDelete(file.path, file.name)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            Удалить
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </MainContent>
            <Footer />
            
            {/* Модальное окно создания папки */}
            {showCreateFolderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Создать новую папку</h3>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Введите имя папки"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowCreateFolderModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={createFolder}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Создать
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Модальное окно подтверждения удаления */}
            {showDeleteModal && itemToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Подтверждение удаления</h3>
                        <p className="mb-6">
                            Вы уверены, что хотите удалить <span className="font-semibold">"{itemToDelete.name}"</span>?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setItemToDelete(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilesPage;