#include <iostream>
#include <iomanip>
#include <mysqlx/xdevapi.h>

#include "utils/functions.hpp"

std::string UrlEncode(const std::string& value);

int main(int argc, char** argv)
{
	std::string password = LoadDataFromFile("password.bin");
	password = password.substr(0, password.length()-2);


	try
	{
		mysqlx::Session session(3306, "root", password);
		
	}
	catch (const mysqlx::Error& err)
	{
		std::cout << "ERROR: " << err << std::endl;
		return 1;
	}
	catch (std::exception& ex)
	{
		std::cout << "STD EXCEPTION: " << ex.what() << std::endl;
		return 1;
	}
	catch (const char* ex)
	{
		std::cout << "EXCEPTION: " << ex << std::endl;
		return 1;
	}
	system("pause");
}

std::string UrlEncode(const std::string& value)
{
	std::ostringstream escaped;
	escaped.fill('0');
	escaped << std::hex;

	for (char c : value)
	{
		if (std::isalnum(c) || c == '-' || c == '.' || c == '~')
			escaped << c;
		else
			escaped << std::uppercase << '%' << std::setw(2) << int(static_cast<unsigned char>(c)) << std::setw(0);
	}
	return escaped.str();
}