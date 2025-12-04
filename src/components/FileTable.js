// components/FileTable.jsx
import React from 'react';
import '../styles/FileTable.css';

const getFileIcon = (extension) => {
    const icons = {
        pdf: '📕',
        txt: '📝',
        doc: '📘', docx: '📘',
        xls: '📗', xlsx: '📗',
        ppt: '📙', pptx: '📙',
        jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', bmp: '🖼️',
        mp3: '🎵', wav: '🎵', ogg: '🎵',
        mp4: '🎬', avi: '🎬', mkv: '🎬',
        zip: '📦', rar: '📦', '7z': '📦', tar: '📦',
        js: '📜', json: '📜', html: '🌐', css: '🎨',
    };
    
    return icons[extension.toLowerCase()] || '📄';
};

const FileTable = ({ files, onDownload, onDelete }) => {
    if (files.length === 0) {
        return <p className="text-gray-500 italic">Файлов нет</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="file-table">
                <thead>
                    <tr>
                        <th>Имя</th>
                        <th>Размер</th>
                        <th>Тип</th>
                        <th>Изменен</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map(file => (
                        <tr key={file.path}>
                            <td>
                                <div className="flex items-center">
                                    <span className="mr-2 text-lg">
                                        {getFileIcon(file.extension)}
                                    </span>
                                    <span className="font-medium truncate max-w-xs">
                                        {file.name}
                                    </span>
                                </div>
                            </td>
                            <td>{file.readableSize}</td>
                            <td>
                                <span className="file-type-badge">
                                    {file.extension || 'файл'}
                                </span>
                            </td>
                            <td>
                                {new Date(file.lastModified).toLocaleDateString()}
                            </td>
                            <td>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onDownload(file.path, file.name)}
                                        className="file-action-button file-action-button--download"
                                        title="Скачать"
                                        type="button"
                                    >
                                        📥
                                    </button>
                                    <button
                                        onClick={() => onDelete(file.path, file.name)}
                                        className="file-action-button file-action-button--delete"
                                        title="Удалить"
                                        type="button"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FileTable;