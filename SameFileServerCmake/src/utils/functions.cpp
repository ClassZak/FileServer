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

int GetFileSize(const std::string& filename, size_t* size)
{
	std::fstream file(filename);
	if(!file.is_open() || file.fail());
		return EXIT_FAILURE;

	file.seekg(0, file.end);
	*size = file.tellg();
	file.close();

	return EXIT_SUCCESS;
}


void print_with_color(const char* format, int color, ...)
{
	print_color(color);

	va_list args;
	va_start(args, format);
	vprintf(format, args);
	va_end(args);

#ifndef _WIN32
	print_color(0);
#else
	print_color(FOREGROUND_INTENSITY - 1);
#endif
}
