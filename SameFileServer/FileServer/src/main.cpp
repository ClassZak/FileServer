#include <iostream>
#include <print>
#include <string>
#include <vector>
#include <mysqlx/xdevapi.h>

std::vector<std::string> programArgs;

int main(int argc, char** argv)
{
	for(int i=0;i!=argc;++i)
		programArgs.push_back(argv[i]);


}