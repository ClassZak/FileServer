#include "Socket.hpp"

void Socket::Close()
{
	CloseClientSocket();
	CloseServerSocket();

	ClearBuffer();
}

void Socket::CloseClientSocket()
{
#ifdef _WIN32
	if (m_clientSocket != INVALID_SOCKET)
	{
		closesocket(m_clientSocket);
		m_clientSocket = INVALID_SOCKET;
	}
#elifdef __unix__
	if (m_clientSocketFd > 0)
	{
		close(m_clientSocketFd);
		m_clientSocketFd = -1;
	}
#endif
}

void Socket::CloseServerSocket()
{
#ifdef _WIN32
	if (m_socket != INVALID_SOCKET)
	{
		closesocket(m_socket);
		m_socket = INVALID_SOCKET;
	}
#elifdef __unix__
	if (m_socketFd > 0)
	{
		close(m_socketFd);
		m_socketFd = -1;
	}
#endif
}


void Socket::BindNewConnection(int domainType, ConnectionType connectionType, int port)
{
	Close();

	m_domainType = domainType;
	m_connectionType = connectionType;
	m_port = port;

	Bind();
}


void Socket::Bind()
{
	if (m_domainType == -1)
		throw std::runtime_error("Bad domain type");
	if (m_connectionType == -1)
		throw std::runtime_error("Bad connection type");

	int connectType =
		m_connectionType == ConnectionType::TCP ? SOCK_STREAM :
		(m_connectionType == ConnectionType::UDP ? SOCK_DGRAM : SOCK_RAW);

#ifdef _WIN32	
	if ((m_socket = socket(m_domainType, connectType, 0)) == INVALID_SOCKET)
#elifdef __unix__
	if ((m_socketFd = socket(m_domainType, connectType, 0)) < 0)
#endif
		throw std::runtime_error("Socket creation failed");


#ifdef _WIN32
	memset(&m_addr, 0, sizeof(m_addr));
#elifdef __unix__
#endif
	m_addr.sin_family = m_domainType;
	m_addr.sin_addr.s_addr = 
#ifdef _WIN32
	inet_addr("0.0.0.0");
#elifdef __unix__
	htonl(INADDR_ANY);
#endif
	m_addr.sin_port = htons(m_port);


#ifdef _WIN32
	if (bind(m_socket, (struct sockaddr*)&m_addr, sizeof(m_addr)) == SOCKET_ERROR)
#elifdef __unix__
	if (bind(m_socketFd, (struct sockaddr*)&m_addr, sizeof(m_addr)) < 0)
#endif
		throw std::runtime_error("Socket binding failed");

	// Если прочитали меньше, чем BUFFER_SIZE, значит, данных больше нет
	listen(m_socket, 2);
}


bool Socket::Accept(const timeval& timeout)
{
	int client_addr_size = sizeof(m_clientAddr);
#ifdef _WIN32
	if (m_clientSocket != INVALID_SOCKET)
#elifdef __unix__
	if (m_clientSocketFd != -1)
#endif
		CloseClientSocket();
	
	
	if ((m_clientSocket = accept(m_socket, (struct sockaddr*)&m_clientAddr, &client_addr_size)) < 0)
#ifdef _WIN32
		return EXIT_FAILURE;
#elifdef __unix__
		return EXIT_FAILURE;
#endif
	
	
#ifdef _WIN32
	DWORD timeout_ms = timeout.tv_sec * 1000;
	if (setsockopt(m_clientSocket, SOL_SOCKET, SO_RCVTIMEO, (const char*)&timeout_ms, sizeof(timeout_ms)) == SOCKET_ERROR)
	{
		perror("Set socket waiting limit options failed");
		return EXIT_FAILURE;
	}
#elifdef __unix__
	if (setsockopt(m_clientSocketFd, SOL_SOCKET, SO_RCVTIMEO, (const char*)&timeout, sizeof(timeout)) < 0)
	{
		perror("Set socket waiting limit options failed");
		return EXIT_FAILURE;
	}
#endif

	return EXIT_SUCCESS;
}
int Socket::Listen(const struct timeval& timeout, bool crash_by_timeout)
{
	if(Accept(timeout))
		return EXIT_FAILURE;
	
	std::stringstream received_data;
	Socket::AllocateBufferMemory();
	

	static int client_length = sizeof(m_clientAddr);
	int bytes_read;
	while (true)
	{
		if ((bytes_read = recv(m_clientSocket, m_buffer, BUFFER_SIZE, 0)) < 0)
		{
#ifdef _WIN32
			int error = WSAGetLastError();
			if(error == WSA_WAIT_TIMEOUT)
#elifdef __unix__
			if (errno == EAGAIN || errno == EWOULDBLOCK)
#endif
			{
				if (crash_by_timeout)
					return TIMEOUT_FAILURE;
				else
				{
					print_with_color("Timeout occurred! No data received in the specified time.", 31);
					break;
				}
			}
			else
			{
				perror("Receiving failed");
#ifdef _WIN32
				return WSAGetLastError();
#elifdef __unix__
				return EXIT_FAILURE;
#endif
			}
		}
		else if (bytes_read == 0)
		{
			std::cerr << "Connection closed by the peer." << std::endl;
			break;
		}

		received_data.write(m_buffer, bytes_read);

		// Если прочитали меньше, чем BUFFER_SIZE, значит, данных больше нет
		if (bytes_read < BUFFER_SIZE)
			break;
	}

	m_bufferedString = received_data.str();
	return EXIT_SUCCESS;
}


int Socket::SendAnswer(const std::string& answer)
{
#ifdef _WIN32
	if (m_clientSocket == INVALID_SOCKET)
#elifdef __unix__
	if (m_clientSocket == -1)
#endif
		return -1;

	try
	{
		if (answer.size() < BUFFER_SIZE)
			return send(m_clientSocket, answer.c_str(), std::min(answer.size(), (std::size_t)BUFFER_SIZE), 0);
		else
		{
			long long bytes_sent = 0;
			std::string curr_str;
			for (std::size_t i = 0; i < answer.size(); i += BUFFER_SIZE)
			{
				curr_str = answer.substr(i, BUFFER_SIZE);
				bytes_sent +=
#ifdef __unix__
					send
					(
						m_clientSocketFd,
						curr_str.c_str(),
						std::min(curr_str.size(), (std::size_t)BUFFER_SIZE),
						MSG_NOSIGNAL
					);
#elifdef _WIN32
					send(m_clientSocket, curr_str.c_str(), std::min(curr_str.size(), (std::size_t)BUFFER_SIZE), 0);
#endif
			}
			return bytes_sent;
		}
	}
	catch (void* e)
	{
		CloseClientSocket();
	}
}

void Socket::ClearBuffer()
{
	if (m_buffer != nullptr)
	{
		delete[] m_buffer;
		m_buffer = nullptr;
	}
}

void Socket::AllocateBufferMemory()
{
	ClearBuffer();
	m_buffer = new char[Socket::BUFFER_SIZE];
}

const std::string Socket::GetClientIP() const
{
	char ip_str[INET_ADDRSTRLEN];
	inet_ntop(AF_INET, &m_clientAddr.sin_addr, ip_str, sizeof(ip_str));
	return std::string(ip_str);
}