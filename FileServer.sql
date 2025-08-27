-- DROP DATABASE FileServer;
CREATE DATABASE FileServer;
USE FileServer;
-- -----------------------------------------------------
-- Пользователь
-- -----------------------------------------------------
CREATE TABLE `User` (
	Id				INT AUTO_INCREMENT PRIMARY KEY,
	Login			VARCHAR(64) UNIQUE NOT NULL,
	PasswordHash	CHAR(60) NOT NULL, -- bcrypt
	CreatedAt		TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- -----------------------------------------------------
-- Группа
-- -----------------------------------------------------
CREATE TABLE `Group` (
	Id			INT AUTO_INCREMENT PRIMARY KEY,
	`Name`		NVARCHAR(64) UNIQUE NOT NULL,
	LeaderId	INT NOT NULL,
	FOREIGN KEY (LeaderId) REFERENCES `User`(Id)
);
-- -----------------------------------------------------
-- Связь пользователей с группами
-- -----------------------------------------------------
CREATE TABLE GroupMember (
	IdGroup	INT NOT NULL,
	IdUser	INT NOT NULL,
	PRIMARY KEY (IdGroup, IdUser),
	FOREIGN KEY (IdGroup) REFERENCES `Group`(Id),
	FOREIGN KEY (IdUser) REFERENCES `User`(Id)
);
-- -----------------------------------------------------
-- Метаданные файлов
-- -----------------------------------------------------
CREATE TABLE FileMetadata (
	Id			BIGINT AUTO_INCREMENT PRIMARY KEY,
	`Path`		NVARCHAR(4096) NOT NULL,
	IdOwener	INT NOT NULL,
	IdGroup		INT,
	`Mode`		SMALLINT UNSIGNED NOT NULL, -- UNIX permissions
	`Size`		BIGINT NOT NULL,
	IsPublic	BOOLEAN NOT NULL DEFAULT FALSE,
	CreatedAt	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UpdatedAt	TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (IdOwener)	REFERENCES `User`(Id),
	FOREIGN KEY (IdGroup)	REFERENCES `Group`(Id),
	INDEX path_index (path(768)) -- Префиксный индекс для длинных путей
);