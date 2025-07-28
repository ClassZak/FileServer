#pragma once
#include <sys/types.h>
#ifdef _WIN32
#include "../Functions/Functions.hpp"
#elifdef __unix__
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <arpa/inet.h>
#endif

#include <stdexcept>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <iostream>
#include <algorithm>

#include <string>
#include <sstream>

#include "../ConnectionType/ConnectionType.hpp"


#define TIMEOUT_FAILURE 2

class Socket
{
	std::string m_bufferedString;
	sockaddr_in m_addr{};
	sockaddr_in m_clientAddr{};
	char* m_buffer{};
	int m_domainType = -1;
	int m_sockedFd = -1;
	int m_clientSockedFd = -1;
	int m_port = -1;

	ConnectionType m_connectionType = ConnectionType::None;
	bool m_isListening = false;

	void Bind();

public:
	static const unsigned short BUFFER_SIZE = 0x400;

	Socket(int domainType, ConnectionType connectionType, int port)
	{
		BindNewConnection(domainType, connectionType, port);
	}

	~Socket()
	{
		Close();
	}

	void Close();
	void CloseClientSocket();
	void CloseServerSocket();
	void BindNewConnection(int domainType, ConnectionType connectionType, int port);
	int Listen(const struct timeval& timeout = { 10,0 }, bool crash_by_timeout = false);
	int SendAnswer(const std::string& answer);
	void ClearBuffer();
	void AllocateBufferMemory();

	/// <summary>
	/// Возвращает временный буфер в строковом представлении, т.е. возвращает всё сообщение клиента
	/// </summary>
	const std::string& GetBufferedString()
	{
		return m_bufferedString;
	}

	void ClearBufferedString()
	{
		m_bufferedString.clear();
	}

	const std::string GetClientIP() const;



	static inline void InitTheWSA()
	{
		InitWSA();
	}
	static inline void CleanTheWSA()
	{
		ClearWSA();
	}
};
