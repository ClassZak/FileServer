import React, { useState } from "react";
import { Magnifyingglass } from '../assets/img';
import { FileService } from '../services/FileService';
import '../css_classes/image-button.css';

// components/FileSearch.jsx
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

function FileSearch({ currentPath = '' }) {
    const [searching, setSearching] = useState(false);
    const navigate = useNavigate(); // ← добавляем навигацию
    
    const handleSubmit = async (e) => {
        e.preDefault();
        const form = e.target;
        const query = form.q.value.trim();
        
        if (!query) {
            alert('Введите поисковый запрос');
            return;
        }
        
        // Проверка авторизации
        if (!AuthService.getToken()) {
            alert('Требуется авторизация для поиска');
            return;
        }
        
        setSearching(true);
        
        try {
            // ПЕРЕНАПРАВЛЯЕМ на /files с параметрами поиска
            const params = new URLSearchParams();
            params.append('q', query);
            
            if (currentPath) {
                params.append('searchPath', currentPath); // ← передаем путь поиска
            }
            
            navigate(`/files?${params.toString()}`);
            
        } catch (error) {
            console.error('Ошибка поиска:', error);
            alert('Ошибка при выполнении поиска');
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