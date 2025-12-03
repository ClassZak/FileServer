import { useState } from 'react';
import MainContent from "../components/MainContent";
import Footer from "../parts/Footer";
import Header from "../parts/Header";
import PermissionManager from "../components/PermissionManager";
import CreateItemModal from "../components/CreateItemModal";

function FilesPage(){
	const [selectedItem, setSelectedItem] = useState(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	// Пример данных файла/папки
	const sampleItem = {
		id: '1',
		name: 'example-folder',
		type: 'folder',
		permissions: [
			{
				subjectType: 'group',
				subjectId: 'admin',
				subjectName: 'Администраторы',
				permissions: { read: true, create: true, update: true, delete: true }
			}
		]
	};

	const handleCreateItem = (itemData) => {
		// Отправка на бэкенд
		console.log('Создание:', itemData);
	};

	return (
		<div>
			<Header />
			<MainContent>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<h1>Файлы</h1>
					<button 
						onClick={() => setIsCreateModalOpen(true)}
						style={{
							background: 'var(--accent-gold)',
							color: 'white',
							border: 'none',
							padding: '10px 20px',
							borderRadius: '4px',
							cursor: 'pointer'
						}}
					>
						+ Создать
					</button>
				</div>

				{/* Здесь будет список файлов/папок */}
				<div 
					style={{ 
						padding: '10px', 
						border: '1px dashed #ccc', 
						margin: '20px 0',
						cursor: 'pointer'
					}}
					onClick={() => setSelectedItem(sampleItem)}
				>
					📁 example-folder (кликните для управления правами)
				</div>

				{selectedItem && (
					<PermissionManager 
						item={selectedItem} 
						isFile={selectedItem.type === 'file'}
					/>
				)}

				<CreateItemModal
					isOpen={isCreateModalOpen}
					onClose={() => setIsCreateModalOpen(false)}
					onCreate={handleCreateItem}
					parentFolder={null} // или ID текущей папки
				/>
			</MainContent>
			<Footer />
		</div>
	);
}

export default FilesPage;