#include "SecureSocket.hpp"

SecureSocket::SecureSocket
(int domainType, ConnectionType connectionType, int port, const std::array<uint8_t, 32>& key)
	: Socket(domainType, connectionType, port), m_aesKey{key}
{
	OPENSSL_init_crypto(OPENSSL_INIT_LOAD_CRYPTO_STRINGS, nullptr);
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
	std::array<uint8_t, 12u> iv{};
	std::array<uint8_t, 16u> tag{};
	uint32_t data_size;
	
	if (!ReceiveExact(iv.data(), iv.size())) 
		throw std::runtime_error("IV receive failed");
	if (!ReceiveExact(tag.data(), tag.size())) 
		throw std::runtime_error("Tag receive failed");
	if (!ReceiveExact(&data_size, sizeof(data_size))) 
		throw std::runtime_error("Size receive failed");

	data_size = ntohl(data_size);
	std::vector<uint8_t> ciphrered_text(data_size);
	if(!ReceiveExact(ciphrered_text.data(), data_size))
		throw std::runtime_error("Data receive failed");
	
	return AesEncrypt(ciphrered_text, iv, tag);
}
nlohmann::json SecureSocket::ReceiveJson()
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


std::vector<uint8_t> SecureSocket::AesEncrypt(const std::vector<uint8_t>& plainText, std::array<uint8_t, 12>& iv, std::array<uint8_t, 16>& tag)
{
	EVP_CIPHER_CTX* cipher = EVP_CIPHER_CTX_new();
	if(!cipher)
		throw std::runtime_error("EVP_CIPHER_CTX_new failed");

	std::vector<uint8_t> ciphered_text(plainText.size() + EVP_MAX_BLOCK_LENGTH);
	int len = 0, true_ciphered_text_length = 0;
	try
	{
		std::random_device random_device;
		std::generate(iv.begin(), iv.end(), [&random_device]{return random_device();});

		// Настройка шифрования
		if (1 != EVP_EncryptInit_ex(cipher, EVP_aes_256_gcm(), nullptr, nullptr, nullptr))
			throw std::runtime_error("EncryptInit failed");
		if (1 != EVP_CIPHER_CTX_ctrl(cipher, EVP_CTRL_GCM_SET_IVLEN, 12, nullptr))
			throw std::runtime_error("Set IV length failed");
		if (1 != EVP_EncryptInit_ex(cipher, nullptr, nullptr, m_aesKey.data(), iv.data()))
			throw std::runtime_error("EncryptInit key/IV failed");
		// Шифрование данных
		if (1 != EVP_EncryptUpdate(cipher,ciphered_text.data(), &len, plainText.data(), plainText.size()))
			throw std::runtime_error("EncryptUpdate failed");
		true_ciphered_text_length = len;
		// Финализация шифрования
		if(1 != EVP_EncryptFinal_ex(cipher, ciphered_text.data() + len, &len))\
			throw std::runtime_error("EncryptFinal failed");
		true_ciphered_text_length += len;
		// Получение тега
		if(1 != EVP_CIPHER_CTX_ctrl(cipher, EVP_CTRL_GCM_GET_TAG, 16, tag.data()))
			throw std::runtime_error("Failed to get tag");

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
std::vector<uint8_t> SecureSocket::AesDecrypt(const std::vector<uint8_t>& cipheredText, const std::array<uint8_t, 12>& iv, const std::array<uint8_t, 16>& tag)
{
	EVP_CIPHER_CTX* cipher = EVP_CIPHER_CTX_new();
	if (!cipher) throw std::runtime_error("EVP_CIPHER_CTX_new failed");

	std::vector<uint8_t> plain_text(cipheredText.size() + EVP_MAX_BLOCK_LENGTH);
	int len = 0, plaintext_len = 0;

	try
	{
		// Настройка дешифрования
		if (1 != EVP_DecryptInit_ex(cipher, EVP_aes_256_gcm(), nullptr, nullptr, nullptr))
			throw std::runtime_error("DecryptInit failed");
		if (1 != EVP_CIPHER_CTX_ctrl(cipher, EVP_CTRL_GCM_SET_IVLEN, 12, nullptr))
			throw std::runtime_error("Set IV length failed");
		if (1 != EVP_DecryptInit_ex(cipher, nullptr, nullptr, m_aesKey.data(), iv.data()))
			throw std::runtime_error("DecryptInit key/IV failed");
		// Дешифрование данных
		if (1 != EVP_DecryptUpdate(cipher, plain_text.data(), &len, cipheredText.data(), cipheredText.size()))
			throw std::runtime_error("DecryptUpdate failed");
		plaintext_len = len;
		// Установка тега для проверки
		if (1 != EVP_CIPHER_CTX_ctrl(cipher, EVP_CTRL_GCM_SET_TAG, 16, const_cast<uint8_t*>(tag.data())))
			throw std::runtime_error("Set tag failed");
		// Финализация с проверкой тега
		int rc = EVP_DecryptFinal_ex(cipher, plain_text.data() + len, &len);
		if (rc <= 0)
			throw std::runtime_error("Tag verification failed");
		plaintext_len += len;

		plain_text.resize(plaintext_len);
		EVP_CIPHER_CTX_free(cipher);

		return plain_text;
	}
	catch (...)
	{
		EVP_CIPHER_CTX_free(cipher);
		throw;
	}
}

