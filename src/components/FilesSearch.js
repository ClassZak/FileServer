import React, { useState } from "react";
import { Magnifyingglass } from '../assets/img';
import { FileService } from '../services/FileService';
import AuthService from '../services/AuthService';
import '../css_classes/image-button.css';

function FileSearch({ currentPath = '' }) {
    const [searching, setSearching] = useState(false);
    
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
            // ВАРИАНТ 1: Прямой поиск с выводом в консоль
            const results = await FileService.find(query, currentPath, token);
            
            console.log('=== РЕЗУЛЬТАТЫ ПОИСКА ===');
            console.log('Запрос:', query);
            console.log('Путь поиска:', currentPath || '(корень)');
            console.log('Найдено папок:', results.folders.length);
            console.log('Найдено файлов:', results.files.length);
            console.log('Общее количество:', results.totalResults);
            
            console.log('\n=== ПАПКИ ===');
            results.folders.forEach(folder => {
                console.log(`📁 ${folder.name} (${folder.readableSize}, ${folder.itemCount} элементов)`);
            });
            
            console.log('\n=== ФАЙЛЫ ===');
            results.files.forEach(file => {
                console.log(`📄 ${file.name} (${file.readableSize}, ${file.extension || 'без расширения'})`);
            });
            
            console.log('=== КОНЕЦ РЕЗУЛЬТАТОВ ===');
            
            // Можно показать уведомление пользователю
            alert(`Найдено ${results.totalResults} результатов по запросу "${query}"`);
            
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