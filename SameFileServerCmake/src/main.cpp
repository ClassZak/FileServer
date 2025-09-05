#include <iostream>
#include <iomanip>
#include <mysqlx/xdevapi.h>
#include <mysql/jdbc.h>

#define CPPHTTPLIB_OPENSSL_SUPPORT
#include <httplib.h>

#include "utils/functions.hpp"

std::string UrlEncode(const std::string& value);

int main(int argc, char** argv)
{
	std::string password = LoadDataFromFile("password.bin");
	password = password.substr(0, password.length()-2);

	sql::Driver* driver = sql::mysql::get_driver_instance();
	const std::string url = "tcp://127.0.0.1:3306"; // URL для классического протокола
	const std::string user = "root";
	const std::string database = "FileServer";

	std::cout << "Connector/C++ JDBC example program..." << std::endl;
	
	httplib::SSLServer server("../cert.pem", "../cert.key");
	server.Get("/hi", [](const httplib::Request& req, httplib::Response& res) {
		res.set_content("Hello World!", "text/plain");
	});

	try
	{
		sql::Driver* driver = sql::mysql::get_driver_instance();
		sql::Connection* con(driver->connect(url, user, password));
		std::cout << "Connection established successfully!" << std::endl;

		con->setSchema(database);
		sql::Statement* stmt(con->createStatement());
		sql::ResultSet* res(stmt->executeQuery("SELECT PasswordHash FROM `User`"));

		while (res->next())
		{
			std::cout << "MySQL replies: \t\t" << res->getString("PasswordHash") << std::endl;
			std::cout << "MySQL says it again:\t" << res->getString(1) << std::endl;
		}


	}
	catch (sql::SQLException& e)
	{
		// Обработка исключений, специфичных для MySQL
		std::cout << "# ERR: SQLException in " << __FILE__;
		std::cout << "(" << __FUNCTION__ << ") on line " << __LINE__ << std::endl;
		std::cout << "# ERR: " << e.what();
		std::cout << " (MySQL error code: " << e.getErrorCode();
		std::cout << ", SQLState: " << e.getSQLState() << " )" << std::endl;
		return EXIT_FAILURE;
	}
	catch (std::exception& e)
	{
		// Обработка других стандартных исключений
		std::cout << "STD EXCEPTION: " << e.what() << std::endl;
		return EXIT_FAILURE;
	}
	catch (...)
	{
		// Обработка всех остальных исключений
		std::cout << "Unknown exception" << std::endl;
		return EXIT_FAILURE;
	}


	server.listen("0.0.0.0", 5000);
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