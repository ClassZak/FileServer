#include "FileManager.hpp"
#include "../utils/functions.hpp"

#include <algorithm>
#include <cctype>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <regex>
#include <string>
#include <vector>
#include <memory>
#include <thread>
#include <stdexcept>
#include <iostream>




inline void FileManager::SetRootDirectory(const char* path)
{
	if(m_rootDirectory)
		delete [] m_rootDirectory;
	if(!(m_rootDirectory = static_cast<char*>(malloc(strlen(path)+1))));
		throw std::runtime_error("Не удалось выделить память");
	strcpy(m_rootDirectory, path);
}




int FileManager::CreateTheFile(const char* path, const char* data, size_t data_size)
{
	size_t save_path_size = strlen(path);
	char* save_path = static_cast<char*>(malloc(save_path_size+1));
	if(!save_path)
		return EXIT_FAILURE;
	strcpy(save_path, path);
	
	if (!MakePathSafe(&save_path, &save_path_size))
	{
		if(strlen(save_path) == 0)
			return EXIT_FAILURE;
		
		std::fstream file(save_path, std::ios::binary | std::ios::out);
		if(!file.is_open() || file.fail())
			return EXIT_FAILURE;
		
		if(data != nullptr and data_size)
			file.write(data, data_size);
		
		file.close();
	}
	else
		return EXIT_FAILURE;
	
	return EXIT_SUCCESS;
}

int FileManager::ReadTheFile(const char* path, char** data, size_t* size)
{
	if(!data || !size)
		return EXIT_FAILURE;
	if(*data)
		free(*data);
	
	size_t save_path_size = strlen(path);
	char* save_path = static_cast<char*>(malloc(save_path_size + 1));
	if (!save_path)
		return EXIT_FAILURE;
	strcpy(save_path, path);
	
	if (!MakePathSafe(&save_path, &save_path_size))
	{
		if(!std::filesystem::exists(save_path) || !std::filesystem::is_regular_file(save_path))
			return EXIT_FAILURE;
		
		try
		{
			std::string loaded_data = LoadDataFromFile(save_path);
			if(!(*data = static_cast<char*>(malloc(loaded_data.size()))))
				return EXIT_FAILURE;
			
			strcpy(*data, loaded_data.data());
			
			return EXIT_SUCCESS;
		}
		catch (...)
		{
			return EXIT_FAILURE;
		}
		
		return EXIT_SUCCESS;
	}
	else
		return EXIT_FAILURE;
	
}

int FileManager::UpdateTheFile(const char* path, const char* data, size_t size)
{
	return UpdateTheFile(path, data, NULL, size);
}

int FileManager::DeleteTheFile(const char* path)
{
	size_t save_path_size = strlen(path);
	char* save_path = static_cast<char*>(malloc(save_path_size + 1));
	if (!save_path)
		return EXIT_FAILURE;
	strcpy(save_path, path);
	
	if (!MakePathSafe(&save_path, &save_path_size) and std::filesystem::is_regular_file(save_path))
		return !std::filesystem::remove(save_path);
	else
		return EXIT_FAILURE;
}


int FileManager::UpdateTheFile(const char* path, const char* data, long long offset, size_t size)
{
	size_t save_path_size = strlen(path);
	char* save_path = static_cast<char*>(malloc(save_path_size + 1));
	if (!save_path)
		return EXIT_FAILURE;
	strcpy(save_path, path);
	
	if (!MakePathSafe(&save_path, &save_path_size))
	{
		std::fstream file(save_path, std::ios::binary | std::ios::in | std::ios::out);
		if (!std::filesystem::exists(save_path) || !std::filesystem::is_regular_file(save_path))
			return EXIT_FAILURE;
		
		file.seekg(offset);
		file.write(data, size);
		if(file.fail())
			return EXIT_FAILURE;
		file.close();

		return EXIT_SUCCESS;
	}
	else
		return EXIT_FAILURE;
}




int FileManager::MakePathSafe(char** path, size_t* newPathSize)
{
	namespace fs = std::filesystem;
	*newPathSize = 0;
	if (!path || !*path)
		return EXIT_SUCCESS;

	// Освобождаем память автоматически при выходе из функции
	std::unique_ptr<char[]> original_path(*path);
	*path = nullptr;
	*newPathSize = 0;

	// Удаляем все пробельные символы в начале и конце

	std::string path_str = std::string(original_path.get());
	std::replace(path_str.begin(), path_str.end(), '\\', '/');
	path_str.erase
	(
		std::remove_if(path_str.begin(), path_str.end(), [](unsigned char ch)
		{return !std::isprint(ch) || std::isspace(ch);}), 
		path_str.end()
	);
	
	// Удаление пробелов
	path_str = std::regex_replace(path_str, REGEX_SPACE, "/");
	// Удаление повторяющихся подряд "/"
	path_str = std::regex_replace(path_str, REGEX_SLASH, "/");
	// Удаляем точки для папок
	path_str = std::regex_replace(path_str, REGEX_DOT,"");
	// Удаление метки диска
	path_str = std::regex_replace(path_str, REGEX_DISK, "");
	

	// Проверяем зарезервированные имена устройств
	path_str = std::regex_replace(path_str, REGEX_DEVICE, "");

	// Нормализуем путь и проверяем, что он относительный
	try
	{
		if (path_str.empty())
		{
			*path = static_cast<char*>(malloc(1));
			if (!*path)
				throw std::runtime_error("Не удалось выделить память");
			(*path)[0] = '\0';

			return EXIT_SUCCESS;
		}

		fs::path fs_path(path_str);
		fs_path = fs_path.lexically_normal();

		path_str = fs_path.string();
	}
	catch (const fs::filesystem_error&)
	{
		// В случае ошибки преобразования делаем путь пустым
		path_str.clear();
	}



	// Удаляем запрещенные символы
	path_str = std::regex_replace(path_str, std::regex(REGEX_PROHIBITED_CHARS), "");

	std::replace(path_str.begin(), path_str.end(), '\\', '/');
	// Если путь пуст после всех преобразований
	if (path_str.empty())
	{
		*path = static_cast<char*>(malloc(1));
		if (!*path)
			throw std::runtime_error("Не удалось выделить память");
		(*path)[0] = '\0';

		return EXIT_SUCCESS;
	}

	// Выделяем память для нового пути
	if(path_str.size() > FileManager::MAX_PATH_SIZE)
		path_str = path_str.substr(0, FileManager::MAX_PATH_SIZE);
	
	*newPathSize = path_str.size();
	*path = static_cast<char*>(malloc(*newPathSize + 1));
	if (!*path)
		throw std::runtime_error("Не удалось выделить память");

	std::memcpy(*path, path_str.c_str(), *newPathSize + 1);

	return EXIT_SUCCESS;
}




#ifdef _WIN32
inline bool FileManager::IsProhibitedChar(const char ch)
{
	for (unsigned char i = 0; i != 15; ++i)
	{
		if(PROHIBITED_CHARS[i] == ch)
			return true;
	};
	return false;
}
#ifdef _DEBUG
#include <chrono>
void FileManager::TestMakePathSafe()
{
	struct TestCase
	{
		const char* input;
		const char* expected;
		const char* description;
	};

	std::vector<TestCase> test_cases =
	{
		{"path/with/../traversal", "path/with/traversal", "Path traversal"},
		{"../path/to/file", "path/to/file", "Блокировка перехода наверх"},
		{"C:/Windows/file.txt", "Windows/file.txt", "Блокировка абсолютных путей"},
		{"COM1.txt", ".txt", "Зарезервированное имя с расширением"},
		{"", "", "Пустая строка"},
		{"   ", "", "Только пробелы"},
		{"  test.txt  ", "test.txt", "Удаление пробелов"},
		{"./file.txt", "file.txt", "Блокировка текущей директории"},
		{"file*name.txt", "filename.txt", "Удаление запрещенных символов"},
		{"CON", "", "Зарезервированное имя"},
		{"normal/file.txt", "normal/file.txt", "Нормальный путь"},
		{"valid-name.txt", "valid-name.txt", "Валидное имя файла"},
	};

	for (const auto& test : test_cases)
	{
		char* path = strdup(test.input);
		size_t newSize;
		
		try
		{
			auto start = std::chrono::system_clock::now();
			MakePathSafe(&path, &newSize);
			print_with_color
			(
				"Time elapsed:%d\n",
				FOREGROUND_GREEN | FOREGROUND_RED,
				std::chrono::duration_cast<std::chrono::milliseconds>
				(std::chrono::system_clock::now() - start).count()
			);
			std::string result(path);
			std::string expected(test.expected);

			if (result != expected)
			{
				print_color(FOREGROUND_RED);
				std::cerr << "Тест failed: " << test.description
					<< "\nInput: '" << test.input
					<< "'\nExpected: '" << expected
					<< "'\nGot: '" << result << "'\n\n";
				print_color(FOREGROUND_INTENSITY - 1);
			}
			else
				std::cout << "Тест passed: " << test.description << "\n";
		}
		catch (const std::exception& e)
		{
			print_color(FOREGROUND_RED);
			std::cerr << "Тест error: " << test.description
				<< "\nError: " << e.what() << "\n";
			print_color(FOREGROUND_INTENSITY - 1);
		}

		free(path);
	}
}
#endif

const char FileManager::PROHIBITED_CHARS[15] =
{ '<', '>', ':', '\"', '/', '\\', '|', '?', '*', '%', '!', '@', '\n', '\r', '\t' };
const std::regex FileManager::REGEX_SPACE				= std::regex(R"((\s+)\S+(\s+))");
const std::regex FileManager::REGEX_SLASH				= std::regex(R"(//+)");
const std::regex FileManager::REGEX_DOT					= std::regex(R"((\.\.\/|\.\/))");
const std::regex FileManager::REGEX_DISK				= std::regex(R"(^(\w:/))");
const std::regex FileManager::REGEX_PROHIBITED_CHARS	= std::regex(R"([<>:"|?*%!@\n\r\t])");
const std::regex FileManager::REGEX_DEVICE				= std::regex(R"((CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9]))",
																		std::regex_constants::icase);
#endif
