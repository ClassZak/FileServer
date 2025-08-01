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



std::vector<std::string> programArgs;
std::mutex printMutex;

int main(int argc, char** argv)
{
	for(int i=0;i!=argc;++i)
		programArgs.push_back(argv[i]);

	setlocale(LC_ALL, "Russian");

	Socket::InitTheWSA();
	std::cout << "OpenSSL version: " << OPENSSL_VERSION_TEXT << std::endl;

	std::array<uint8_t, 32> key =
	{
		0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
		0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
		0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
		0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0
	};


	std::thread thread_for_default_connection ([&]()
	{
		while (true)
		{
			try
			{
				Socket socket(AF_INET, ConnectionType::TCP, 8000);
				printMutex.lock();
				std::println("new iteration of default connection");
				printMutex.unlock();
				int res = socket.Listen();
				if (!res)
				{
					printMutex.lock();
					std::println("{}",socket.GetBufferedString());
					printMutex.unlock();
				}
			}
			catch (...)
			{
			}
		}
	});
	std::thread thread_for_encrypt_connection([&]()
	{
		try
		{
			while (true)
			{
				SecureSocket server(AF_INET, ConnectionType::TCP, 54321, key);
				printMutex.lock();
				std::println("new iteration of encrypt connection");
				printMutex.unlock();
				if (!server.Accept())
				{
					try
					{
						auto request = server.ReceiveJson();
						printMutex.try_lock();
						std::cout << "Received: " << request.dump() << std::endl;
						printMutex.unlock();

						nlohmann::json response = {
							{"status", "success"},
							{"message", "Data processed"}
						};

						server.SendJson(response);
					}
					catch (const std::exception& e)
					{
						printMutex.lock();
						std::cerr << "Error: " << e.what() << "\n";
						printMutex.unlock();
					}
					catch (...)
					{
						printMutex.lock();
						std::cerr << "Unhandled error" << "\n";
						printMutex.unlock();
					}
					server.CloseClientSocket();
				}
			}
		}
		catch (const std::exception& e)
		{
			printMutex.try_lock();
			std::cerr << "Server error: " << e.what() << std::endl;
			printMutex.unlock();
		}
	});
	thread_for_encrypt_connection.join();
	thread_for_default_connection.join();

#ifdef _WIN32
	system("pause");
#elifdef __unix__
	printf("Press the \"Enter\" key to continue\n");
	getchar();
#endif
	Socket::CleanTheWSA();
}