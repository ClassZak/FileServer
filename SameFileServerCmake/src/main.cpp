#include <iostream>
#include <iomanip>
#include <string>
#include <print>
#include <locale>
#include <mysqlx/xdevapi.h>
#include <mysql/jdbc.h>

#define CPPHTTPLIB_OPENSSL_SUPPORT
#include <httplib.h>
#include <nlohmann/json.hpp>


#include "utils/functions.hpp"
#include "Core/FileManager.hpp"


std::string UrlEncode(const std::string& value);
inline void ConnectToMySQL();


const nlohmann::json CONFIG = nlohmann::json::parse(LoadDataFromFile("../config.json"));
const std::string FRONTEND_SERVER_IP = CONFIG.at("server_ip").get<std::string>();
const std::string PASSWORD = CONFIG.at("password").get<std::string>();
const std::string ROOT_DIRECTORY = CONFIG.value("root_directory", "files");

int main(int argc, char** argv)
{
	setlocale(LC_ALL, "Russian");

	std::cout<< CONFIG<< std::endl;
	FileManager::GetInstance().SetRootDirectory(ROOT_DIRECTORY.c_str());

	
	httplib::SSLServer server("../cert.pem", "../key.pem");

	server.Get("/hi", [](const httplib::Request& req, httplib::Response& res) {
		res.set_content("{\"message\":\"Hello World!\"}", "application/json");
	});
	server.Post("/api/files/create", [](const httplib::Request& req, httplib::Response& res) {
		
		if (req.has_param("file"))
		{
			std::string filename = req.get_param_value("file");
			bool created = false;
			if(req.body.empty())
				created = !FileManager::GetInstance().CreateTheFile(filename.c_str());
			else
				created = 
				!FileManager::GetInstance().CreateTheFile(filename.c_str(), req.body.c_str(), req.body.length());

			res.status = created ? 201 : 500;
		}
		else
		{
			res.status = 400;
			res.set_content("No file name", "text/plain");
		}
	});


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

inline void ConnectToMySQL()
{
	std::cout << "Connect to MySQL server" << std::endl;

	sql::Driver* driver = sql::mysql::get_driver_instance();
	const std::string url = "tcp://127.0.0.1:3306"; // URL для классического протокола
	const std::string user = "root";
	const std::string database = "FileServer";
}
