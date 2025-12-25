import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Добавляем этот импорт!
import { Magnifyingglass } from '../assets/img';
import AuthService from '../services/AuthService'; // FileService больше не нужен здесь
import '../css_classes/image-button.css';

function FileSearch({ currentPath = '' }) {
    const [searching, setSearching] = useState(false);
    const navigate = useNavigate(); // Хук для навигации
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const query = form.q.value.trim();
        
        if (!query) {
            alert('Введите поисковый запрос');
            return;
        }
        
        const token = AuthService.getToken();
        if (!token) {
            alert('Требуется авторизация для поиска');
            return;
        }
        
        setSearching(true);
        
        try {
            // Вместо выполнения поиска здесь, ПЕРЕНАПРАВЛЯЕМ на /files
            const params = new URLSearchParams();
            params.append('q', query); // параметр поиска
            
            if (currentPath) {
                params.append('searchPath', currentPath); // путь, где искать
            }
            
            // Перенаправляем на /files с параметрами поиска
            navigate(`/files?${params.toString()}`);
            
        } catch (error) {
            console.error('Ошибка поиска:', error);
            alert('Ошибка при выполнении поиска. Проверьте консоль для деталей.');
        } finally {
            setSearching(false);
            form.reset();
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="search-form" id="files_search">
            <input
                name="q"
                className="item"
                placeholder={searching ? "Поиск..." : "Поиск файлов и папок..."}
                type="text"
                defaultValue=""
                disabled={searching}
            />
            <button 
                type="submit" 
                className="image-button"
                disabled={searching}
                title="Найти файлы и папки"
            >
                <img alt="search" src={Magnifyingglass} />
            </button>
        </form>
    );
}

export default FileSearch;