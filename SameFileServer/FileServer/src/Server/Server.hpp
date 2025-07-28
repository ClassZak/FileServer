#pragma once
#include <thread>
#include <mutex>
#include <optional>
#include <vector>
#include <map>
#include <string>
#include <functional>
#include <filesystem>
#include <algorithm>

class Server
{
	Server() = default;
public:
	Server(const Server&) = delete;
	Server& operator=(const Server&) = delete;

	Server& GetInstance()
	{
		static Server server;
		return server;
	}
};

