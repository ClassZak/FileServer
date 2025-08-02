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



#include "Socket/Socket.hpp"
#include "Socket/SecureSocket.hpp"
#include "Crypto/EAS_GCM.hpp"



int main()
{
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
					std::cout << "Waiting for connection on port 54321..." << std::endl;
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
							std::cout << "Received JSON: " << request.dump(2) << std::endl;
							printMutex.unlock();
							
							// Подготовка ответа
							nlohmann::json response =
							{
								{"status", "success"},
								{"message", "Data processed successfully"},
								{"received_size", server.GetBufferedString().size()}
							};
							
							// Отправка ответа
							if (!server.SendJson(response))
							{
								std::lock_guard<std::mutex> lock(printMutex);
								std::cerr << "Failed to send response" << std::endl;
							}
						}
						catch (const std::exception& e)
						{
							std::lock_guard<std::mutex> lock(printMutex);
							std::cerr << "Processing error: " << e.what() << std::endl;
							
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
								std::cerr << "Failed to send error response" << std::endl;
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

//void run_server() {
//	try {
//		// Используем фиксированный ключ для тестирования
//		std::array<uint8_t, 32> key = {
//			0x33, 0x32, 0x2d, 0x62, 0x79, 0x74, 0x65, 0x2d,
//			0x6c, 0x6f, 0x6e, 0x67, 0x2d, 0x65, 0x6e, 0x63,
//			0x72, 0x79, 0x70, 0x74, 0x69, 0x6f, 0x6e, 0x2d,
//			0x6b, 0x65, 0x79, 0x2d, 0x31, 0x32, 0x33, 0x34
//		};
//
//		SecureSocket server(AF_INET, ConnectionType::TCP, 54321, key);
//		server.Listen();
//
//		std::cout << "Server started. Waiting for connections..." << std::endl;
//
//		while (true) {
//			if (server.Accept() == 0) {
//				try {
//					std::cout << "Client connected" << std::endl;
//
//					// Прием и вывод отладочной информации
//					auto request = server.ReceiveJson();
//					std::cout << "Received JSON: " << request.dump() << std::endl;
//
//					// Простой ответ
//					nlohmann::json response = {
//						{"status", "success"},
//						{"message", "Data received successfully"}
//					};
//					server.SendJson(response);
//				}
//				catch (const std::exception& e) {
//					std::cerr << "Processing error: " << e.what() << std::endl;
//
//					try {
//						nlohmann::json error_resp = {
//							{"status", "error"},
//							{"message", e.what()}
//						};
//						server.SendJson(error_resp);
//					}
//					catch (...) {
//						std::cerr << "Failed to send error response" << std::endl;
//					}
//				}
//				server.CloseClientSocket();
//			}
//		}
//	}
//	catch (const std::exception& e) {
//		std::cerr << "Server fatal error: " << e.what() << std::endl;
//	}
//}
//
//
//std::vector<std::string> programArgs;
//std::mutex printMutex;
//
//int main(int argc, char** argv)
//{
//	for(int i=0;i!=argc;++i)
//		programArgs.push_back(argv[i]);
//
//	setlocale(LC_ALL, "Russian");
//
//	Socket::InitTheWSA();
//	std::cout << "OpenSSL version: " << OPENSSL_VERSION_TEXT << std::endl;
//
//	std::array<uint8_t, 32> key =
//	{
//		0x32, 0x2d, 0x62, 0x79, 0x74, 0x65, 0x2d, 0x6c,
//		0x6f, 0x6e, 0x67, 0x2d, 0x65, 0x6e, 0x63, 0x72,
//		0x79, 0x70, 0x74, 0x69, 0x6f, 0x6e, 0x2d, 0x6b,
//		0x65, 0x79, 0x2d, 0x31, 0x32, 0x33, 0x34, 0x00
//	};
//
//
//	std::thread thread_for_default_connection ([&]()
//	{
//		while (true)
//		{
//			try
//			{
//				Socket socket(AF_INET, ConnectionType::TCP, 8000);
//				printMutex.lock();
//				std::println("new iteration of default connection");
//				printMutex.unlock();
//				int res = socket.Listen();
//				if (!res)
//				{
//					printMutex.lock();
//					std::println("{}",socket.GetBufferedString());
//					printMutex.unlock();
//				}
//			}
//			catch (...)
//			{
//			}
//		}
//	});
//	std::thread thread_for_encrypt_connection([&]()
//	{
//		run_server();
//	});
//	thread_for_encrypt_connection.join();
//	thread_for_default_connection.join();
//
//#ifdef _WIN32
//	system("pause");
//#elifdef __unix__
//	printf("Press the \"Enter\" key to continue\n");
//	getchar();
//#endif
//	Socket::CleanTheWSA();
//}