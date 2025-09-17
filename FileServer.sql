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

-- SELECT * FROM `User`;
SELECT * FROM `User`;
SELECT * FROM `Group`;
SELECT * FROM `GroupMember`;
SELECT 
	g.`Name` AS 'name', u.Login AS 'Leader'
FROM GroupMember gm
	JOIN `Group` g
LEFT JOIN `User` u ON
	u.Id = g.IdLeader
LEFT JOIN `User` u2 ON
	u2.Id = gm.IdUser
WHERE u.Id = 7 OR u2.Id = 7;
SELECT 
	g.`Name` AS 'name', u.Login AS 'Leader'
FROM GroupMember gm
	JOIN `Group` g
LEFT JOIN `User` u ON
	u.Id = gm.IdUser
WHERE u.Id = 7;

INSERT INTO `Group` (`Name`, IdLeader)  VALUES ('sus', 2);
INSERT INTO `GroupMember`  VALUES (1, 7);


-- -----------------------------------------------------
-- Группа
-- -----------------------------------------------------
CREATE TABLE `Group` (
	Id			INT AUTO_INCREMENT PRIMARY KEY,
	`Name`		NVARCHAR(64) UNIQUE NOT NULL,
	IdLeader	INT NOT NULL,
	FOREIGN KEY (IdLeader) REFERENCES `User`(Id)
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
-- Типы сообщений
-- -----------------------------------------------------
CREATE TABLE MessageType(
	Id		INT AUTO_INCREMENT PRIMARY KEY,
	`Name`	NVARCHAR(64) UNIQUE NOT NULL
);
INSERT INTO MessageType (`Name`) VALUES ('InviteToGroup');
-- -----------------------------------------------------
-- Сообщения о приглашении 
-- -----------------------------------------------------
CREATE TABLE Message(
	Id				INT AUTO_INCREMENT PRIMARY KEY,
	IdMessageType	INT NOT NULL,
	Content			TEXT,
	IdSender		INT NOT NULL,
	IdRecipient		INT NOT NULL,
	
	FOREIGN KEY (IdMessageType)	REFERENCES MessageType(Id),
	FOREIGN KEY (IdSender)		REFERENCES `User`(Id),
	FOREIGN KEY (IdRecipient)	REFERENCES `User`(Id),
	
	CONSTRAINT CHK_Different_Sender_Recipient 
		CHECK (IdSender != IdRecipient)
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