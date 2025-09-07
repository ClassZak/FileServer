#include <iostream>
#include <iomanip>
#include <string>
#include <print>
#include <mysqlx/xdevapi.h>
#include <mysql/jdbc.h>

#define CPPHTTPLIB_OPENSSL_SUPPORT
#include <httplib.h>
#include <nlohmann/json.hpp>


#include "utils/functions.hpp"
#include "Core/FileManager.hpp"


std::string UrlEncode(const std::string& value);


const nlohmann::json CONFIG = nlohmann::json::parse(LoadDataFromFile("../config.json"));
const std::string FRONTEND_SERVER_IP = CONFIG.at("server_ip").get<std::string>();
const std::string PASSWORD = CONFIG.at("password").get<std::string>();
const std::string ROOT_DIRECTORY = CONFIG.value("root_directory", "files");

int main(int argc, char** argv)
{
	FileManager::TestMakePathSafe();
	std::cout<< CONFIG<< std::endl;
	std::cout <<"Connect to MySQL server"<<std::endl;

	sql::Driver* driver = sql::mysql::get_driver_instance();
	const std::string url = "tcp://127.0.0.1:3306"; // URL для классического протокола
	const std::string user = "root";
	const std::string database = "FileServer";

	
	httplib::SSLServer server("../cert.pem", "../key.pem");
	server.Get("/hi", [](const httplib::Request& req, httplib::Response& res) {
		res.set_content("{\"message\":\"Hello World!\"}", "application/json");
	});

	try
	{
		sql::Driver* driver = sql::mysql::get_driver_instance();
		sql::Connection* con(driver->connect(url, user, PASSWORD));
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

		getchar();
		return EXIT_FAILURE;
	}
	catch (std::exception& e)
	{
		// Обработка других стандартных исключений
		std::cout << "STD EXCEPTION: " << e.what() << std::endl;
		getchar();
		return EXIT_FAILURE;
	}
	catch (...)
	{
		// Обработка всех остальных исключений
		std::cout << "Unknown exception" << std::endl;
		getchar();
		return EXIT_FAILURE;
	}


	server.listen("0.0.0.0", 5000);

	getchar();
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