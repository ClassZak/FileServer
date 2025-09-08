#pragma once
#include <regex>

class FileManager
{
	char* m_rootDirectory = nullptr;
	FileManager() = default;
public:
	int CreateTheFile	(const char* path, const char* data = nullptr);
	int ReadTheFile		(const char* path, char* data, size_t* size);
	int UpdateTheFile	(const char* path, const char* data);
	int DeleteTheFile	(const char* path, const char* data);



	static inline FileManager& GetInstance()
	{
		//Singleton из C++11
		static FileManager instance;
		return instance;
	}
	static int MakePathSafe(char** path, size_t* newPathSize);

#ifdef _WIN32
	static const size_t MAX_PATH_SIZE = 260;
	static const char PROHIBITED_CHARS[15];

	static inline bool IsProhibitedChar(const char ch);
#ifdef _DEBUG
	static void TestMakePathSafe();
#endif

	static const std::regex REGEX_SPACE;
	static const std::regex REGEX_SLASH;
	static const std::regex REGEX_DOT;
	static const std::regex REGEX_DISK;
	static const std::regex REGEX_DEVICE;
	static const std::regex REGEX_PROHIBITED_CHARS;
#elif

#endif
};
