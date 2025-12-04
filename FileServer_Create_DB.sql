-- DROP DATABASE FileServer2;
CREATE DATABASE FileServer2;
USE FileServer2;


-- -----------------------------------------------------
-- Пользователь
-- -----------------------------------------------------
CREATE TABLE `User` (
	Id				INT AUTO_INCREMENT PRIMARY KEY,
	Surname		 VARCHAR(45) NOT NULL,
	`Name`			VARCHAR(45) NOT NULL,
	Patronymic		VARCHAR(45) NOT NULL,
	Email			VARCHAR(60) NOT NULL,
	PasswordHash	CHAR(60) NOT NULL ,
	CreatedAt		TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- -----------------------------------------------------
-- Администратор
-- -----------------------------------------------------
CREATE TABLE Administrator(
	Id		INT AUTO_INCREMENT PRIMARY KEY,
	IdUser	INT NOT NULL,

	FOREIGN KEY (IdUser) REFERENCES `User`(Id)
);
-- -----------------------------------------------------
-- Группа
-- -----------------------------------------------------
CREATE TABLE `Group` (
	Id			INT AUTO_INCREMENT PRIMARY KEY,
	`Name`		NVARCHAR(64) UNIQUE NOT NULL,
	IdCreator	INT NOT NULL,

	FOREIGN KEY (IdCreator) REFERENCES `User`(Id)
);
-- -----------------------------------------------------
-- Участник группы
-- -----------------------------------------------------
CREATE TABLE GroupMember (
	IdGroup	INT NOT NULL,
	IdUser	INT NOT NULL,

	PRIMARY KEY (IdGroup, IdUser),
	FOREIGN KEY (IdGroup) REFERENCES `Group`(Id),
	FOREIGN KEY (IdUser) REFERENCES `User`(Id)
);
-- -----------------------------------------------------
-- Метаданные папок
-- -----------------------------------------------------
CREATE TABLE DirectoryMetadata (
	Id			BIGINT AUTO_INCREMENT PRIMARY KEY,
	`Path`		NVARCHAR(4096) NOT NULL,
	IdUser		INT,
	IdGroup		INT,
	`Mode`		SMALLINT UNSIGNED NOT NULL,

	FOREIGN KEY (IdUser)	REFERENCES `User`(Id),
	FOREIGN KEY (IdGroup)	REFERENCES `Group`(Id),
	INDEX path_index (path(768)), -- Префиксный индекс для длинных путей

	CONSTRAINT CHK_DirectoryMetadata_is_used_for_subject
	CHECK (IdGroup != NULL OR IdUser != NULL)
);
-- -----------------------------------------------------
-- Метаданные файлов
-- -----------------------------------------------------
CREATE TABLE FileMetadata (
	Id			BIGINT AUTO_INCREMENT PRIMARY KEY,
	`Path`		NVARCHAR(4096) NOT NULL,
	IdUser		INT,
	IdGroup		INT,
	`Mode`		SMALLINT UNSIGNED NOT NULL,

	FOREIGN KEY (IdUser)	REFERENCES `User`(Id),
	FOREIGN KEY (IdGroup)	REFERENCES `Group`(Id),
	INDEX path_index (path(768)), -- Префиксный индекс для длинных путей

	CONSTRAINT CHK_FileMetadata_is_used_for_subject
	CHECK (IdGroup != NULL OR IdUser != NULL)
);
-- -----------------------------------------------------
-- Удалённый файл
-- -----------------------------------------------------
CREATE TABLE DeletedFile(
	IdFileMetaData		INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
	WorkTime	DATETIME NOT NULL,
);
-- -----------------------------------------------------
-- Тип операции
-- -----------------------------------------------------
CREATE TABLE OperationType(
	Id					INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`Name`				NVARCHAR(45) NOT NULL
);
-- -----------------------------------------------------
-- История работы
-- -----------------------------------------------------
CREATE TABLE WorkHistory(
	Id					INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
	WorkTime			DATETIME NOT NULL,
	Path				NVARCHAR(4096) NOT NULL,
	IdOperationType		INT NOT NULL,
	IdUser				INT NOT NULL,

	FOREIGN KEY (IdOperationType)	REFERENCES `OperationType`(Id),
	FOREIGN KEY (IdUser)			REFERENCES `User`(Id)
)
