#pragma once
#include <regex>

class FileManager
{
	char* m_rootDirectory = nullptr;
	FileManager() = default;
public:
	void SetRootDirectory(const char* path);
	
	int CreateTheFile	(const char* path, const char* data = nullptr, size_t data_size = 0);
	int ReadTheFile		(const char* path, char** data, size_t* size);
	int UpdateTheFile	(const char* path, const char* data, size_t size);
	int DeleteTheFile	(const char* path);

	int UpdateTheFile	(const char* path, const char* data, long long offset, size_t size);

	static inline FileManager& GetInstance()
	{
		//Singleton из C++11
		static FileManager instance;
		return instance;
	}
	static int MakePathSafe(char** path, size_t* newPathSize);
	/// <summary>
	/// </summary>
	/// <param name="filename">Save string processed by MakePathSafe</param>
	/// <returns></returns>
	static int CreateDirectoriesForFile(const char* filename);

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
