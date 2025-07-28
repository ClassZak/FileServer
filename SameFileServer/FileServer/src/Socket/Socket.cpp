#include "Socket.hpp"

void Socket::Close()
{
	CloseClientSocket();
	CloseServerSocket();

	ClearBuffer();
}

void Socket::CloseClientSocket()
{
#ifdef __unix__
	if (m_clientSockedFd > 0)
		close(m_clientSockedFd);
	m_clientSockedFd = -1;
#endif
}

void Socket::CloseServerSocket()
{
#ifdef __unix__
	if (m_sockedFd > 0)
		close(m_sockedFd);
	m_sockedFd = -1;
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

	if ((m_sockedFd = socket(m_domainType, connectType, 0)) < 0)
		throw std::runtime_error("Socket creation failed");

	m_addr.sin_family = m_domainType;
	m_addr.sin_port = htons(m_port);
	m_addr.sin_addr.s_addr = htonl(INADDR_ANY);

	if (bind(m_sockedFd, (struct sockaddr*)&m_addr, sizeof(m_addr)) < 0)
		throw std::runtime_error("Socket binding failed");

	// Если прочитали меньше, чем BUFFER_SIZE, значит, данных больше нет
	listen(m_sockedFd, 1);
}

int Socket::Listen(const struct timeval& timeout, bool crash_by_timeout)
{
	unsigned int client_add_size = sizeof(m_clientAddr);
	if (m_clientSockedFd != -1)
		CloseClientSocket();
#ifdef __unix__
	m_clientSockedFd = accept(m_sockedFd, (struct sockaddr*)&m_clientAddr, &client_add_size);
#endif
	if (m_clientSockedFd < 0)
		return EXIT_FAILURE;

	if (setsockopt(m_clientSockedFd, SOL_SOCKET, SO_RCVTIMEO, (const char*)&timeout, sizeof(timeout)) < 0)
	{
		perror("Set socket waiting limit options failed");
		return EXIT_FAILURE;
	}

	std::stringstream received_data;
	Socket::AllocateBufferMemory();

	while (true)
	{
		int bytes_read = recv(m_clientSockedFd, m_buffer, BUFFER_SIZE, 0);

		if (bytes_read < 0)
		{
			if (errno == EAGAIN || errno == EWOULDBLOCK)
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
				return EXIT_FAILURE;
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
	if (m_clientSockedFd != -1)
		try
	{
		if (answer.size() < BUFFER_SIZE)
			return send(m_clientSockedFd, answer.c_str(), std::min(answer.size(), (std::size_t)BUFFER_SIZE), 0);
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
						m_clientSockedFd,
						curr_str.c_str(),
						std::min(curr_str.size(), (std::size_t)BUFFER_SIZE),
						MSG_NOSIGNAL
					);
#elifdef _WIN32
					send(m_clientSockedFd, curr_str.c_str(), std::min(curr_str.size(), (std::size_t)BUFFER_SIZE), 0);
#endif
			}
			return bytes_sent;
		}
	}
	catch (void* e)
	{
		CloseClientSocket();
	}
	else
		return -1;
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