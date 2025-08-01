#pragma once
#include <openssl/evp.h>
#include <openssl/err.h>
#include <openssl/crypto.h>
#include <random>
#include <stdexcept>

#include "Socket.hpp"

class SecureSocket : public Socket
{
public:
	SecureSocket(int domainType, ConnectionType connectionType, int port, const std::array<uint8_t, 32>& key);
	bool SendEncrypted(const std::vector<uint8_t>& data);
	bool SendJson(const nlohmann::json& json);
	std::vector<uint8_t> ReceiveEncrypted();
	nlohmann::json ReceiveJson();

	//bool Accept(const timeval& timeout) override;
private:
	std::array<uint8_t, 32> m_aesKey;
	


	// Вспомогательные методы
	bool ReceiveExact(void* buffer, size_t size);
	std::vector<uint8_t> AesEncrypt
	(const std::vector<uint8_t>& plainText, std::array<uint8_t, 12>& iv, std::array<uint8_t, 16>& tag);
	std::vector<uint8_t> AesDecrypt
	(const std::vector<uint8_t>& cipherText, const std::array<uint8_t, 12>& iv, const std::array<uint8_t, 16>& tag);
};

