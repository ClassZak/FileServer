#include <iostream>
#include <thread>
#include <functional>
#include <mutex>
#include <print>
#include <iostream>
#include <string>
#include <vector>
#include <locale>
#include <openssl/evp.h>
#include <openssl/opensslv.h>


#include <mysqlx/xdevapi.h>
#include <mysqlx/version_info.h>
#include <mysqlx/common_constants.h>



#include "Socket/Socket.hpp"
#include "Socket/SecureSocket.hpp"
#include "Crypto/EAS_GCM.hpp"



int main()
{
	srand(time(NULL));
	setlocale(LC_ALL, "Russian");

	std::cout<<"OpenSSL version: "<<OPENSSL_VERSION_TEXT<<std::endl;

	std::cout<<"MySQL connector version: "<< MYSQL_CONCPP_NAME <<
	'\t' << MYSQL_CONCPP_VERSION <<
	"\tLicense:" <<MYSQL_CONCPP_LICENSE << std::endl;

	Socket::InitTheWSA();
	std::mutex printMutex;
	
	
	bool onepackage=true;
	std::thread thread_for_secure_connection([&printMutex, &onepackage]()->void
	{
		// Фиксированный ключ для тестирования
		const std::array<uint8_t, 32> key =
		{
			0x33, 0x32, 0x2d, 0x62, 0x79, 0x74, 0x65, 0x2d,
			0x6c, 0x6f, 0x6e, 0x67, 0x2d, 0x65, 0x6e, 0x63,
			0x72, 0x79, 0x70, 0x74, 0x69, 0x6f, 0x6e, 0x2d,
			0x6b, 0x65, 0x79, 0x2d, 0x31, 0x32, 0x33, 0x34
		};
		
		if (onepackage)
		{
			while (true)
			{
				try
				{
					SecureSocket server(AF_INET, ConnectionType::TCP, 54321, key);
					
					printMutex.lock();
					std::cout <<
					"Waiting for connection on port 54321..." << std::endl;
					printMutex.unlock();
					
					// Ожидание подключения и получение данных
					struct timeval timeout = { 5, 0 }; // 5 секунд
					if (server.Listen(timeout, false) == EXIT_SUCCESS)
					{
						try
						{
							printMutex.lock();
							std::cout<<
							"Client connected. Data size: " <<
							server.GetBufferedString().size() << " bytes\n";
							printMutex.unlock();
							
							// Прием и обработка запроса
							auto request = server.ReceiveJson();
							
							printMutex.lock();
							std::cout <<
							"Received JSON: "<<
							request.dump(2) << std::endl;
							printMutex.unlock();
							
							// Подготовка ответа
							nlohmann::json response =
							{
								{"status", "success"},
								{"message", "Data processed successfully"},
								{"received_size", 
								server.GetBufferedString().size()}
							};
							
							// Отправка ответа
							if (!server.SendJson(response))
							{
								std::lock_guard<std::mutex> lock(printMutex);
								std::cerr <<
								"Failed to send response" << std::endl;
							}
						}
						catch (const std::exception& e)
						{
							std::lock_guard<std::mutex> lock(printMutex);
							std::cerr <<
							"Processing error: " << e.what() << std::endl;
							
							try
							{
								nlohmann::json error_resp =
								{
									{"status", "error"},
									{"message", e.what()},
								};
								server.SendJson(error_resp);
							}
							catch (...)
							{
								std::cerr <<
								"Failed to send error response" << std::endl;
							}
						}
					}
					else
					{
						std::lock_guard<std::mutex> lock(printMutex);
						std::cout << "Listen timeout or error" << std::endl;
					}
					
					// Закрытие соединения и очистка
					server.Close();
					server.ClearSecureBuffer();
				}
				catch (const std::exception& e)
				{
					std::lock_guard<std::mutex> lock(printMutex);
					std::cerr << "Server error: " << e.what() << std::endl;
				}
			}
		}
	});
	
	thread_for_secure_connection.join();
	
	Socket::CleanTheWSA();
	return 0;
}
