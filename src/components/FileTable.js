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
    const FileRow = function (file) {
        if (file === null || file === undefined)
            file = {empty:true}

        return <tr key={file.empty ? '-' : file.path}>
            <td>
                <div className="flex items-center">
                    <span className="mr-2 text-lg">
                        {file.empty ? '' : getFileIcon(file.empty ? '-' : file.extension)}
                    </span>
                    <span className="font-medium truncate max-w-xs">
                        {file.empty ? '-' : file.name}
                    </span>
                </div>
            </td>
            <td>{file.empty ? '-' : file.readableSize}</td>
            <td>
                <span className="file-type-badge">
                    {file.empty ? '-' : (file.extension || 'файл')}
                </span>
            </td>
            <td>
                {file.empty ? '-' : new Date(file.lastModified).toLocaleDateString()}
            </td>
            <td>
                {file.empty ? '-' :
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
                }
            </td>
        </tr>
    };

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
                    {
                        files.length ? (
                        files.map(file => FileRow(file))) :
                        (FileRow())
                    }
                </tbody>
            </table>
        </div>
    );
};

export default FileTable;