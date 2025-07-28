#include <iostream>
#include <print>
#include <string>
#include <vector>
#include <locale>


#include <mysqlx/xdevapi.h>


#include "Socket/Socket.hpp"



std::vector<std::string> programArgs;

int main(int argc, char** argv)
{
	for(int i=0;i!=argc;++i)
		programArgs.push_back(argv[i]);

	setlocale(LC_ALL, "Russian");

	Socket::InitTheWSA();


	Socket socket(AF_INET, ConnectionType::TCP, 1000);
	int res = socket.Listen();
	if(!res)
		std::println("{}",socket.GetBufferedString());


	Socket::CleanTheWSA();
}