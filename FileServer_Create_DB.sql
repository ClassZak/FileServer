-- DROP DATABASE FileServer1;
CREATE DATABASE FileServer1;
USE FileServer1;


-- -----------------------------------------------------
-- Пользователь и администратор
-- -----------------------------------------------------
CREATE TABLE `User` (
	Id				INT AUTO_INCREMENT PRIMARY KEY,
	Surname			VARCHAR(45) NOT NULL,
	`Name`			VARCHAR(45) NOT NULL,
	Patronymic		VARCHAR(45) NOT NULL,
	Email			VARCHAR(60) NOT NULL,
	PasswordHash	CHAR(60) NOT NULL,
	CreatedAt		TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Administrator (
	Id	INT NOT NULL PRIMARY KEY,

	FOREIGN KEY (Id) REFERENCES `User`(Id)
);




-- -----------------------------------------------------
-- Группа и её участники
-- -----------------------------------------------------
CREATE TABLE `Group` (
	Id			INT AUTO_INCREMENT PRIMARY KEY,
	`Name`		NVARCHAR(64) UNIQUE NOT NULL,
	IdCreator	INT NOT NULL,

	FOREIGN KEY (IdCreator) REFERENCES `User`(Id)
);

CREATE TABLE GroupMember (
	IdGroup	INT NOT NULL,
	IdUser	INT NOT NULL,

	PRIMARY KEY (IdGroup, IdUser),
	FOREIGN KEY (IdGroup) REFERENCES `Group`(Id),
	FOREIGN KEY (IdUser)  REFERENCES `User`(Id)
);




-- -----------------------------------------------------
-- Файлы и папки (с флагом мягкого удаления)
-- -----------------------------------------------------
CREATE TABLE FileEntity (
	Id			BIGINT AUTO_INCREMENT PRIMARY KEY,
	Path		NVARCHAR(4096) NOT NULL UNIQUE,
	CreatedAt	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	IsDeleted	BOOLEAN NOT NULL DEFAULT FALSE,

	INDEX path_index (Path(768))
);

CREATE TABLE FolderEntity (
	Id			BIGINT AUTO_INCREMENT PRIMARY KEY,
	Path		NVARCHAR(4096) NOT NULL UNIQUE,
	CreatedAt	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	IsDeleted	BOOLEAN NOT NULL DEFAULT FALSE,

	INDEX path_index (Path(768))
);




-- -----------------------------------------------------
-- Удалённые версии
-- -----------------------------------------------------
CREATE TABLE DeletedFile (
	Id				BIGINT AUTO_INCREMENT PRIMARY KEY,
	IdFile			BIGINT NOT NULL,
	OriginalPath	NVARCHAR(4096) NOT NULL,
	IdDeletedByUser	INT NOT NULL,
	DeletedAt		DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	Version			INT NOT NULL,

	FOREIGN KEY (IdFile)			REFERENCES FileEntity(Id),
	FOREIGN KEY (IdDeletedByUser)	REFERENCES `User`(Id),

	INDEX idx_deleted_file (IdFile, Version),
	INDEX idx_deleted_by_user (IdDeletedByUser)
);

CREATE TABLE DeletedFolder (
	Id				BIGINT AUTO_INCREMENT PRIMARY KEY,
	IdFolder		BIGINT NOT NULL,
	OriginalPath	NVARCHAR(4096) NOT NULL,
	IdDeletedByUser	INT NOT NULL,
	DeletedAt		DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	Version			INT NOT NULL,

	FOREIGN KEY (IdFolder)			REFERENCES FolderEntity(Id),
	FOREIGN KEY (IdDeletedByUser)	REFERENCES `User`(Id),

	INDEX idx_deleted_folder (IdFolder, Version)
);




-- -----------------------------------------------------
-- Права доступа
-- -----------------------------------------------------
CREATE TABLE FilePermission (
	Id				BIGINT AUTO_INCREMENT PRIMARY KEY,
	IdFileEntity	BIGINT NOT NULL,
	IdUser			INT NULL,
	IdGroup			INT NULL,
	Mode			SMALLINT UNSIGNED NOT NULL,

	FOREIGN KEY (IdFileEntity)	REFERENCES FileEntity(Id)	ON DELETE CASCADE,
	FOREIGN KEY (IdUser)		REFERENCES `User`(Id)		ON DELETE CASCADE,
	FOREIGN KEY (IdGroup)		REFERENCES `Group`(Id)		ON DELETE CASCADE,

	INDEX idx_file_user		(IdFileEntity, IdUser),
	INDEX idx_file_group	(IdFileEntity, IdGroup),

	CONSTRAINT permission_is_useful CHECK ((IdUser IS NOT NULL) != (IdGroup IS NOT NULL))
);

CREATE TABLE FolderPermission (
	Id				BIGINT AUTO_INCREMENT PRIMARY KEY,
	IdFolderEntity	BIGINT NOT NULL,
	IdUser			INT NULL,
	IdGroup			INT NULL,
	Mode			SMALLINT UNSIGNED NOT NULL,

	FOREIGN KEY (IdFolderEntity)	REFERENCES FolderEntity(Id)	ON DELETE CASCADE,
	FOREIGN KEY (IdUser)			REFERENCES `User`(Id)		ON DELETE CASCADE,
	FOREIGN KEY (IdGroup)			REFERENCES `Group`(Id)		ON DELETE CASCADE,

	INDEX idx_folder_user	(IdFolderEntity, IdUser),
	INDEX idx_folder_group	(IdFolderEntity, IdGroup),

	CONSTRAINT permission_is_useful CHECK ((IdUser IS NOT NULL) != (IdGroup IS NOT NULL))
);




-- -----------------------------------------------------
-- История работы (с сохранением пути и типа объекта)
-- -----------------------------------------------------
CREATE TABLE OperationType (
	Id		INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`Name`	NVARCHAR(45) NOT NULL
);

CREATE TABLE WorkHistory (
	Id					BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
	WorkTime			DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	IdOperationType		INT NOT NULL,
	IdUser				INT NOT NULL,
	IdFileEntity		BIGINT NULL,
	IdFolderEntity		BIGINT NULL,
	Path				NVARCHAR(4096) NOT NULL,
	IsFile				BOOLEAN NOT NULL,
	Details				TEXT NULL,

	FOREIGN KEY (IdOperationType)	REFERENCES OperationType(Id),
	FOREIGN KEY (IdUser)			REFERENCES `User`(Id),
	FOREIGN KEY (IdFileEntity)		REFERENCES FileEntity(Id)	ON DELETE SET NULL,
	FOREIGN KEY (IdFolderEntity)	REFERENCES FolderEntity(Id)	ON DELETE SET NULL,

	INDEX idx_history_user_time	(IdUser, WorkTime),
	INDEX idx_history_path		(Path(768))
);




SHOW TABLES;
