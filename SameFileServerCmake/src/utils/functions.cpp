#include "functions.hpp"
#ifdef WIN32
#include <windows.h>
#elif __unix__
#include <errno.h>
#include <unistd.h>
#endif

#include <string>
#include <fstream>

std::string LoadDataFromFile(const std::string& filename)
{
	std::ifstream file(filename, std::ios::binary);
	file.seekg(0, file.end);
	int size = file.tellg();
	file.seekg(0, file.beg);
	if (!file.is_open())
	{
		int error;
#ifdef WIN32
		error = GetLastError();
#else
		error = errno;
#endif
		throw error;
	}

	char* buffer = new char[size+1];

	file.read(buffer, size);
	buffer[size]='\0';
	std::string data = buffer;
	delete [] buffer;

	return data;
}
