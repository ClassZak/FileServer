# FileServer

FileServer это проект веб приложения для работы с файловой системой малых и средних предприятий. Данное решение позволяет работать с файлами организации и управлять доступом к ним, а так же пользователями и их группами (отделами и подразделениями).

Данный проект разрабатывается при помощи Mysql и Mariadb, Kotlin с фреймворком Spring, библиотеки для фронтенда React.


## 🖼️ Внешний вид сайта


![Image alt](https://github.com/ClassZak/FileServer/blob/master/screenshot/screenshot1.png)
![Image alt](https://github.com/ClassZak/FileServer/blob/master/screenshot/screenshot2.png)
![Image alt](https://github.com/ClassZak/FileServer/blob/master/screenshot/screenshot3.png)

### Страница администратора

![Image alt](https://github.com/ClassZak/FileServer/blob/master/screenshot/screenshot4.png)

### Страницы администратора для управления системой

![Image alt](https://github.com/ClassZak/FileServer/blob/master/screenshot/screenshot5.png)

## 🛠 Запуск сайта

Для запуска необходимо выполнить следующие действия:
1) Склонировать репозитрий 
```bash
mkdir repositories
cd repositories
git clone https://github.com/ClassZak/FileServer.git
cd FileServer
```
2) Установить разрешение на запуск скриптов
```bash
chmod +x *.sh
```

3) Выполнить sql код из файла DBCrearionScript.sql для создания БД:
- Зайти в Mysql или Mariadb
```bash
sudo mysql -u root
```
```bash
sudo mariadb -u root
```
- Проверить метод аутентификации
```sql
SELECT user, plugin FROM mysql.user WHERE user = '<пользователь для БД>';
```
- Установить пароль
```sql
ALTER USER '<пользователь для БД>'@'localhost' IDENTIFIED WITH mysql_native_password BY '<пароль>';
FLUSH PRIVILEGES;
EXIT;
```
- Выполнить скрипт создания БД:
```sql
SOURCE /home/dev/repositories/FileServer/FileServer_Create_DB.sql
```

4) Настроить Angular сервер

1. Перейти в директорию angular_server
```bash
cd angular_server
```
2. Выполнить команду установки библиотек
```bash
npm install
```
3. Запустить фронтенд сервер
```bash
npm start
```

5) Настроить Kotlin Spring сервер

1. Отредактируйте application_example.properties, настроив пароль для БД и ключ JWT для авторизации.
Перед этим откройте новый терминал в директории репозитория
```bash
vim application_example.properties
```
2. Скопируйте application_example.properties под именем application.properties в директорию kotlin_spring_server/src/main/resources
```bash
cp application_example.properties kotlin_spring_server/src/main/resources/application.properties
```
3. Перейдите в директорию бэкендного сервера и запустите сервер
```bash
cd kotlin_spring_server
./gradlew bootRun
```


## 👨‍💻 Страницы сайта

1) Главная страница;
2) Страница авторизации;
3) Страница "Файлы";
4) Страница "О проекте";
5) Страница "Аккаунт";
6) Страница просмотра истории работы
7) Страница "Корзина";
8) Страница просмотра всех групп (для администратора);
9) Страница просмотра данных группы;
10) Страница просмотра всех пользователей (для администратора);
11) Страница управления правами пользователей и групп (для администратора);
12) Страница просмотра данных сотрудника (для администратора);
13) Страница просмотра данных пользователя (страница "Аккаунт");
