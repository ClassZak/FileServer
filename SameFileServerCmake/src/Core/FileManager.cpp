#include "FileManager.hpp"

#include <algorithm>
#include <cctype>
#include <cstring>
#include <filesystem>
#include <regex>
#include <string>
#include <vector>
#include <memory>
#include <stdexcept>
#include <iostream>

int FileManager::CreateTheFile(const char* path, const char* data)
{
	return 0;
}

int FileManager::ReadTheFile(const char* path, char* data, size_t* size)
{
	return 0;
}

int FileManager::UpdateTheFile(const char* path, const char* data)
{
	return 0;
}

int FileManager::DeleteTheFile(const char* path, const char* data)
{
	return 0;
}

int FileManager::MakePathSafe(char** path, size_t* newPathSize)
{
	namespace fs = std::filesystem;
	*newPathSize = 0;
	if (!path || !*path)
		return EXIT_SUCCESS;

	// ����������� ������ ������������� ��� ������ �� �������
	std::unique_ptr<char[]> original_path(*path);
	*path = nullptr;
	*newPathSize = 0;

	// ������� ��� ���������� ������� � ������ � �����
	std::string path_str(original_path.get());
	auto start = std::find_if_not(path_str.begin(), path_str.end(), [](unsigned char c)
		{
			return std::isspace(c);
		});
	auto end = std::find_if_not(path_str.rbegin(), path_str.rend(), [](unsigned char c)
		{
			return std::isspace(c);
		}).base();

	// ������ ������� ������ �� ��������
	if (start >= end)
	{
		*path = static_cast<char*>(malloc(1));
		if (!*path) throw std::runtime_error("�� ������� �������� ������");
		(*path)[0] = '\0';
		return EXIT_SUCCESS;
	}

	path_str = std::string(start, end);

	if 
	(
		path_str.find("..") != std::string::npos ||
		path_str.find("/.") != std::string::npos ||
		path_str.find("\\.") != std::string::npos ||
		path_str == "."
	)
	{
		*path = static_cast<char*>(malloc(1));
		if (!*path) 
			throw std::runtime_error("�� ������� �������� ������");
		(*path)[0] = '\0';

		return EXIT_SUCCESS;
	}

	// ������� ����������� ������� � ������� regex
	std::regex prohibited_chars_regex(R"([<>:"|?*%!@\n\r\t])");
	path_str = std::regex_replace(path_str, prohibited_chars_regex, "");

	// ��������� ����������������� ����� ���������
	std::regex reserved_regex(R"(^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$)", std::regex_constants::icase);
	if (std::regex_match(path_str, reserved_regex))
	{
		*path = static_cast<char*>(malloc(1));
		if (!*path)
			throw std::runtime_error("�� ������� �������� ������");
		(*path)[0] = '\0';

		return EXIT_SUCCESS;
	}

	// ����������� ���� � ���������, ��� �� �������������
	try
	{
		fs::path fs_path(path_str);
		fs_path = fs_path.lexically_normal();

		// ���������, ��� ���� ������������� � �� ������� �� ������� ������� ����������
		if (fs_path.is_absolute() || fs_path.string().find("..") != std::string::npos)
		{
			*path = static_cast<char*>(malloc(1));
			if (!*path) throw std::runtime_error("�� ������� �������� ������");
			(*path)[0] = '\0';
			return EXIT_SUCCESS;
		}

		path_str = fs_path.string();
	}
	catch (const fs::filesystem_error&)
	{
		// � ������ ������ �������������� ������ ���� ������
		path_str.clear();
	}

	// ���� ���� ���� ����� ���� ��������������
	if (path_str.empty()) {
		*path = static_cast<char*>(malloc(1));
		if (!*path)
			throw std::runtime_error("�� ������� �������� ������");
		(*path)[0] = '\0';

		return EXIT_SUCCESS;
	}

	// �������� ������ ��� ������ ����
	if(path_str.size() > FileManager::MAX_PATH_SIZE)
		path_str = path_str.substr(0, FileManager::MAX_PATH_SIZE);
	
	*newPathSize = path_str.size();
	*path = static_cast<char*>(malloc(*newPathSize + 1));
	if (!*path)
		throw std::runtime_error("�� ������� �������� ������");

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
		{"  test.txt  ", "test.txt", "�������� ��������"},
		{"../path/to/file", "", "���������� �������� ������"},
		{"./file.txt", "", "���������� ������� ����������"},
		{"C:/Windows/file.txt", "", "���������� ���������� �����"},
		{"file*name.txt", "filename.txt", "�������� ����������� ��������"},
		{"CON", "", "����������������� ���"},
		{"COM1.txt", "", "����������������� ��� � �����������"},
		{"normal/file.txt", "normal/file.txt", "���������� ����"},
		{"path/with/../traversal", "", "Path traversal"},
		{"", "", "������ ������"},
		{"   ", "", "������ �������"},
		{"valid-name.txt", "valid-name.txt", "�������� ��� �����"}
	};

	for (const auto& test : test_cases)
	{
		char* path = strdup(test.input);
		size_t newSize;

		try
		{
			MakePathSafe(&path, &newSize);
			std::string result(path);
			std::string expected(test.expected);

			if (result != expected)
			{
				std::cerr << "���� failed: " << test.description
					<< "\nInput: '" << test.input
					<< "'\nExpected: '" << expected
					<< "'\nGot: '" << result << "'\n\n";
			}
			else
				std::cout << "���� passed: " << test.description << "\n";
		}
		catch (const std::exception& e)
		{
			std::cerr << "���� error: " << test.description
				<< "\nError: " << e.what() << "\n";
		}

		free(path);
	}
}

const char FileManager::PROHIBITED_CHARS[15] =
{ '<', '>', ':', '\"', '/', '\\', '|', '?', '*', '%', '!', '@', '\n', '\r', '\t' };
#endif
