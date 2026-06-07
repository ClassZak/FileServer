-- DROP DATABASE FileServer1;
CREATE DATABASE FileServer1;
USE FileServer1;


-- -----------------------------------------------------
-- User and administrator
-- -----------------------------------------------------
CREATE TABLE `User` (
	Id				INT AUTO_INCREMENT PRIMARY KEY,
	Surname			VARCHAR(45) NOT NULL,
	`Name`			VARCHAR(45) NOT NULL,
	Patronymic		VARCHAR(45) NOT NULL,
	Email			VARCHAR(60) NOT NULL,
	PasswordHash	CHAR(60) NOT NULL,
	CreatedAt		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Administrator (
	Id	INT NOT NULL PRIMARY KEY,

	FOREIGN KEY (Id) REFERENCES `User`(Id)
);




-- -----------------------------------------------------
-- Group and members
-- -----------------------------------------------------
CREATE TABLE `Group` (
	Id			INT AUTO_INCREMENT PRIMARY KEY,
	`Name`		NVARCHAR(64) UNIQUE NOT NULL,
	IdHead		INT NOT NULL,

	FOREIGN KEY (IdHead) REFERENCES `User`(Id)
);

CREATE TABLE GroupMember (
	IdGroup	INT NOT NULL,
	IdUser	INT NOT NULL,

	PRIMARY KEY (IdGroup, IdUser),
	FOREIGN KEY (IdGroup) REFERENCES `Group`(Id),
	FOREIGN KEY (IdUser)  REFERENCES `User`(Id)
);




-- -----------------------------------------------------
-- Files and folders (with soft deletion flag)
-- -----------------------------------------------------
CREATE TABLE FileEntity (
	Id			BIGINT AUTO_INCREMENT PRIMARY KEY,
	Path		NVARCHAR(4096) NOT NULL UNIQUE,
	CreatedAt	TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	IsDeleted	BOOLEAN NOT NULL DEFAULT FALSE,

	INDEX path_index (Path(768))
);

CREATE TABLE FolderEntity (
	Id			BIGINT AUTO_INCREMENT PRIMARY KEY,
	Path		NVARCHAR(4096) NOT NULL UNIQUE,
	CreatedAt	TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	IsDeleted	BOOLEAN NOT NULL DEFAULT FALSE,

	INDEX path_index (Path(768))
);




-- -----------------------------------------------------
-- Deleted versions
-- -----------------------------------------------------
CREATE TABLE DeletedFile (
	Id				BIGINT AUTO_INCREMENT PRIMARY KEY,
	IdFileEntity	BIGINT NOT NULL,
	OriginalPath	NVARCHAR(4096) NOT NULL,
	IdDeletedByUser	INT NOT NULL,
	DeletedAt		DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	Version			INT NOT NULL DEFAULT 1 ,

	FOREIGN KEY (IdFileEntity)		REFERENCES FileEntity(Id),
	FOREIGN KEY (IdDeletedByUser)	REFERENCES `User`(Id),

	INDEX idx_deleted_file (IdFileEntity, Version),
	INDEX idx_deleted_by_user (IdDeletedByUser)
);

CREATE TABLE DeletedFolder (
	Id				BIGINT AUTO_INCREMENT PRIMARY KEY,
	IdFolderEntity	BIGINT NOT NULL,
	OriginalPath	NVARCHAR(4096) NOT NULL,
	IdDeletedByUser	INT NOT NULL,
	DeletedAt		DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	Version			INT NOT NULL DEFAULT 1,

	FOREIGN KEY (IdFolderEntity)	REFERENCES FolderEntity(Id),
	FOREIGN KEY (IdDeletedByUser)	REFERENCES `User`(Id),

	INDEX idx_deleted_folder (IdFolderEntity, Version)
);




-- -----------------------------------------------------
-- Permissions
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
-- Work history (with path save)
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
	IsFile				BOOLEAN NOT NULL DEFAULT TRUE,
	Details				TEXT NULL,

	FOREIGN KEY (IdOperationType)	REFERENCES OperationType(Id),
	FOREIGN KEY (IdUser)			REFERENCES `User`(Id),
	FOREIGN KEY (IdFileEntity)		REFERENCES FileEntity(Id)	ON DELETE SET NULL,
	FOREIGN KEY (IdFolderEntity)	REFERENCES FolderEntity(Id)	ON DELETE SET NULL,

	INDEX idx_history_user_time	(IdUser, WorkTime),
	INDEX idx_history_path		(Path(768))
);




SHOW TABLES;



INSERT INTO OperationType (`Name`) VALUES
('CREATE'),
('READ'),
('UPDATE'),
('DELETE'),
('RESTORE'),
('CHANGE_PERMISSIONS'),
('MOVE'),
('RENAME'),
('DOWNLOAD'),
('UPLOAD');
SELECT * FROM OperationType;




DELIMITER //

CREATE PROCEDURE AddUser(
    IN p_Surname      VARCHAR(45),
    IN p_Name         VARCHAR(45),
    IN p_Patronymic   VARCHAR(45),
    IN p_Email        VARCHAR(60),
    IN p_PasswordHash CHAR(60),        -- BCrypt-hash
    IN p_IsAdmin      BOOLEAN
)
BEGIN
    DECLARE newUserId INT;

    INSERT INTO `User` (Surname, `Name`, Patronymic, Email, PasswordHash, CreatedAt)
    VALUES (p_Surname, p_Name, p_Patronymic, p_Email, p_PasswordHash, NOW());

    SET newUserId = LAST_INSERT_ID();

    IF p_IsAdmin THEN
        INSERT INTO Administrator (Id) VALUES (newUserId);
    END IF;

    SELECT newUserId AS NewUserId;
END //

DELIMITER ;




CALL AddUser(
	'Иванов',
    'Артем',
    'Сергеевич',
    'Ivanov.AS@example.com',
    '$2b$12$jD2Wp2GTzmZgQy.eFloEBeSPEsC1/uI8TR6aCQdzbHlJnXRlq4gHq', -- 123456a
    TRUE
);
CALL AddUser(
	'1',
    '2',
    '3',
    '42sfsdf2@mail.com',
    '$2b$12$jD2Wp2GTzmZgQy.eFloEBeSPEsC1/uI8TR6aCQdzbHlJnXRlq4gHq', -- 123456a
    FALSE
);
SELECT * FROM `User`;
SELECT * FROM Administrator;

