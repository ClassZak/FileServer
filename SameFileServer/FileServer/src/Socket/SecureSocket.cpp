#include "SecureSocket.hpp"

SecureSocket::SecureSocket
(int domainType, ConnectionType connectionType, int port, const std::array<uint8_t, 32>& key, bool onePackageMode)
	: Socket(domainType, connectionType, port), m_aesKey{key}, m_onePackageMode{onePackageMode}
{
	OPENSSL_init_crypto(OPENSSL_INIT_LOAD_CRYPTO_STRINGS, nullptr);
}




void SecureSocket::ParseReceivedData()
{
	if (m_onePackageMode)
	{
		const std::string& data = GetBufferedString();
		if (data.size() < (size_t) 12 + 16 + 4)
			throw std::runtime_error("Received data too short");

		const uint8_t* ptr = reinterpret_cast<const uint8_t*>(data.data());
		// 1. IV (12 байт)
		memcpy(m_iv.data(), ptr, 12);
		ptr += 12;
		// 2. TAG (16 байт)
		memcpy(m_tag.data(), ptr, 16);
		ptr += 16;
		// 3. Размер данных (4 байта, big-endian)
		memcpy(&m_dataSize, ptr, 4);
		ptr += 4;
		m_dataSize = ntohl(m_dataSize);
		// 4. Проверка размера данных
		size_t total_size = (size_t)12 + 16 + 4 + m_dataSize;
		if (data.size() < total_size)
			throw std::runtime_error("Incomplete data received");
		// 5. Зашифрованные данные
		m_encryptedData.assign(ptr, ptr + m_dataSize);
	}
	else
	{
		if(!ReceiveExact(m_iv.data(), m_iv.size()))
			throw std::runtime_error("IV is not received");
		if(!ReceiveExact(m_tag.data(), m_tag.size()))
			throw std::runtime_error("Tag is not received");
		if(!ReceiveExact(&m_dataSize, sizeof(m_dataSize)))
			throw std::runtime_error("Data size is not received");
		m_dataSize = ntohl(m_dataSize);
		m_encryptedData.assign(m_dataSize, 0);
		if(!ReceiveExact(m_encryptedData.data(), m_dataSize))
			throw std::runtime_error("Ciphered text is not received");
	}

#ifdef DEBUG
	// Отладочный вывод
	std::cout << "C++ received IV: ";
	for (auto b : m_iv) printf("%02x", b);
	std::cout << "\nC++ received TAG: ";
	for (auto b : m_tag) printf("%02x", b);
	std::cout << "\nC++ data size: " << m_dataSize << std::endl;
	std::cout << "C++ ciphertext start: ";
	for (size_t i = 0; i < std::min<size_t>(16, m_encryptedData.size()); i++)
		printf("%02x", m_encryptedData[i]);
	std::cout << "..." << std::endl;
#endif
}
void SecureSocket::ClearSecureBuffer()
{
	m_encryptedData.clear();
	m_iv.fill(0);
	m_tag.fill(0);
	m_dataSize = 0;
}



int SecureSocket::Listen(const timeval& timeout, bool crash_by_timeout)
{
	if(m_isListening)
		return WRONG_MODE_FAILURE;
	else
		return ::Socket::Listen();
}




bool SecureSocket::SendEncrypted(const std::vector<uint8_t>& data)
{
	try
	{
		std::array<uint8_t, 12u> iv;
		std::array<uint8_t, 16u> tag;

		auto ciphered_text = AesEncrypt(data, iv, tag);
		uint32_t data_size = static_cast<uint32_t>(ciphered_text.size());
		uint32_t net_size = htonl(data_size);

		std::vector<std::pair<const void*, size_t>> buffers =
		{
			{iv.data(),				iv.size()			},
			{tag.data(),			tag.size()			},
			{&net_size,				sizeof(net_size)	},
			{ciphered_text.data(),	ciphered_text.size()},
		};

		for (const auto& [ptr, size] : buffers)
		{
#ifdef _WIN32
			if (send(m_clientSocket, static_cast<const char*>(ptr), size, 0) != static_cast<int>(size))
#elifdef __unix__
			if (send(m_clientSocketFd, ptr, size, MSG_NOSIGNAL) != static_cast<ssize_t>(size))
#endif
				return false;
		}

		return true;
	}
	catch (...)
	{
		return false;
	}
}
bool SecureSocket::SendJson(const nlohmann::json& json)
{
	try
	{
		std::string json_string_data = json.dump();
		std::vector<uint8_t> json_data(json_string_data.begin(), json_string_data.end());
		SendEncrypted(json_data);
	}
	catch (...)
	{
		return false;
	}
}
bool SecureSocket::SendJsonMsgpack(const nlohmann::json& json)
{
	try
	{
		auto msgpack = nlohmann::json::to_msgpack(json);
		SendEncrypted(msgpack);
	}
	catch (...)
	{
		return false;
	}
}


std::vector<uint8_t> SecureSocket::ReceiveEncrypted()
{
	ParseReceivedData();
	return AesDecrypt(m_encryptedData, m_iv, m_tag);
}
nlohmann::json SecureSocket::ReceiveJson()
{
	auto decrypted = ReceiveEncrypted();
	return nlohmann::json::parse(decrypted.data(), decrypted.data() + decrypted.size());
}
nlohmann::json SecureSocket::ReceiveJsonMsgpack()
{
	auto decrypted = ReceiveEncrypted();
	return nlohmann::json::from_msgpack(decrypted);
}







bool SecureSocket::ReceiveExact(void* buffer, size_t size)
{
	uint8_t* ptr = static_cast<uint8_t*>(buffer);
	size_t received = 0;
	
	while (received < size)
	{
#ifdef _WIN32
		int rc = recv(m_clientSocket, reinterpret_cast<char*>(ptr + received), size - received, 0);
#else
		int rc = recv(m_clientSocketFd, ptr + received, size - received, 0);
#endif
		if (rc <= 0)
			return false;
		received += rc;
	}
	return true;
}







std::vector<uint8_t> SecureSocket::AesEncrypt
(const std::vector<uint8_t>& plainText, std::array<uint8_t, 12>& iv, std::array<uint8_t, 16>& tag)
{
	EVP_CIPHER_CTX* cipher = EVP_CIPHER_CTX_new();
	if(!cipher)
		throw_openssl_error("EVP_CIPHER_CTX_new failed");

	std::vector<uint8_t> ciphered_text(plainText.size() + EVP_MAX_BLOCK_LENGTH);
	int len = 0, true_ciphered_text_length = 0;
	try
	{
		std::random_device random_device;
		std::generate(iv.begin(), iv.end(), [&random_device]{return random_device();});

		// Настройка шифрования
		if (1 != EVP_EncryptInit_ex(cipher, EVP_aes_256_gcm(), nullptr, nullptr, nullptr))
			throw_openssl_error("EncryptInit failed");
		if (1 != EVP_CIPHER_CTX_ctrl(cipher, EVP_CTRL_GCM_SET_IVLEN, 12, nullptr))
			throw_openssl_error("Set IV length failed");
		if (1 != EVP_EncryptInit_ex(cipher, nullptr, nullptr, m_aesKey.data(), iv.data()))
			throw_openssl_error("EncryptInit key/IV failed");
		// Шифрование данных
		if (1 != EVP_EncryptUpdate(cipher,ciphered_text.data(), &len, plainText.data(), plainText.size()))
			throw_openssl_error("EncryptUpdate failed");
		true_ciphered_text_length = len;
		// Финализация шифрования
		if(1 != EVP_EncryptFinal_ex(cipher, ciphered_text.data() + len, &len))\
			throw_openssl_error("EncryptFinal failed");
		true_ciphered_text_length += len;
		// Получение тега
		if(1 != EVP_CIPHER_CTX_ctrl(cipher, EVP_CTRL_GCM_GET_TAG, 16, tag.data()))
			throw_openssl_error("Failed to get tag");

		ciphered_text.resize(true_ciphered_text_length);
		EVP_CIPHER_CTX_free(cipher);

		return ciphered_text;
	}
	catch (...)
	{
		EVP_CIPHER_CTX_free(cipher);
		throw;
	}
}
std::vector<uint8_t> SecureSocket::AesDecrypt
(
	const std::vector<uint8_t>& cipherText,
	const std::array<uint8_t, 12>& iv,
	const std::array<uint8_t, 16>& tag
)
{
	// Инициализация контекста
	EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
	if (!ctx) throw_openssl_error("EVP_CIPHER_CTX_new failed");

	try
	{
		// 1. Инициализация
		if (1 != EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr))
			throw_openssl_error("EVP_DecryptInit_ex failed (initial)");
		// 2. Установка длины IV
		if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, iv.size(), nullptr))
			throw_openssl_error("EVP_CTRL_GCM_SET_IVLEN failed");
		// 3. Установка ключа и IV
		if (1 != EVP_DecryptInit_ex(ctx, nullptr, nullptr, m_aesKey.data(), iv.data()))
			throw_openssl_error("EVP_DecryptInit_ex failed (key/iv)");
		// 4. Дешифрование данных
		std::vector<uint8_t> plaintext(cipherText.size() + EVP_MAX_BLOCK_LENGTH);
		int out_len = 0;
		if (1 != EVP_DecryptUpdate(ctx, plaintext.data(), &out_len, cipherText.data(), cipherText.size()))
			throw_openssl_error("EVP_DecryptUpdate failed");
		
		int total_len = out_len;
		
		// 5. Установка тега для проверки
		if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, tag.size(), const_cast<uint8_t*>(tag.data())))
			throw_openssl_error("EVP_CTRL_GCM_SET_TAG failed");
		// 6. Финальная проверка
		if (1 != EVP_DecryptFinal_ex(ctx, plaintext.data() + out_len, &out_len))
		{
			// Детализация ошибки
			char err_buf[256];
			ERR_error_string_n(ERR_get_error(), err_buf, sizeof(err_buf));
			std::cerr << "TAG VERIFICATION FAILURE DETAIL: " << err_buf << std::endl;
			throw_openssl_error("EVP_DecryptFinal_ex failed (tag verification)");
		}

		total_len += out_len;
		plaintext.resize(total_len);

#ifdef DEBUG
		// Отладочная информация
		std::cout << "C++ decrypted plaintext size: " << plaintext.size() << std::endl;
		std::cout << "C++ decrypted start: ";
		for (size_t i = 0; i < std::min<size_t>(16, plaintext.size()); i++)
			printf("%02x", plaintext[i]);
		std::cout << "..." << std::endl;
#endif // DEBUG

		EVP_CIPHER_CTX_free(ctx);
		return plaintext;
	}
	catch (...)
	{
		EVP_CIPHER_CTX_free(ctx);
		throw;
	}
}

void SecureSocket::throw_openssl_error(const std::string& prefix)
{
	char err_buf[256];
	ERR_error_string_n(ERR_get_error(), err_buf, sizeof(err_buf));
	throw std::runtime_error(prefix + ": " + err_buf);
}

