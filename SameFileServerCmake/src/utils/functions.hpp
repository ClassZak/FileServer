#pragma once
#include <string>
#ifdef _WIN32
#include <windows.h>
#endif


std::string LoadDataFromFile(const std::string& filename);
int GetFileSize(const std::string& filename, size_t* size);

void print_with_color(const char* format, int color, ...);
static inline void print_color(int color)
{
#ifdef _WIN32
	static HANDLE console_handle = GetStdHandle(STD_OUTPUT_HANDLE);
	SetConsoleTextAttribute(console_handle, color);
#else
#ifdef __unix__
	printf("\x1b[%dm", color);
#endif
#endif
}
