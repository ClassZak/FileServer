#pragma once
#ifdef _WIN32
#define PLATFORM_WINDOWS 1
#define NOMINMAX
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#pragma comment(lib, "ws2_32.lib") // Visual Studio
#endif // _WIN32

#ifdef __unix__
#define PLATFORM_LINUX 1
#include <sys/socket.h>
#include <unistd.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <fcntl.h>
#endif // __unix__


#include <nlohmann/json.hpp>
#include <vector>
#include <thread>
#include <cstdint>
#include <stdexcept>
#include <string>
#include <system_error>
#include <mutex>
#include <optional>
#include <map>
#include <functional>
#include <filesystem>
#include <algorithm>
#include <stdarg.h>
#include <stdio.h>




void print_with_color(const char* format, int color, ...);
static inline void print_color(int color)
{
#ifdef _WIN32
	static HANDLE console_handle = GetStdHandle(STD_OUTPUT_HANDLE);
	SetConsoleTextAttribute(console_handle, color);
#elifdef __unix__
	printf("\x1b[%dm", color);
#endif
}


#pragma region Сокеты
#ifdef PLATFORM_WINDOWS
static WSADATA WsaData;
static inline int InitWSA()
{
	return WSAStartup(MAKEWORD(2, 2), &WsaData);
}
static inline int ClearWSA()
{
	return WSACleanup();
}
#elifdef PLATFORM_LINUX

#endif
#pragma endregion





