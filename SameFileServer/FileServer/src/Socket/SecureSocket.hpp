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
	bool SendJsonMsgpack(const nlohmann::json& json);
	std::vector<uint8_t> ReceiveEncrypted();
	nlohmann::json ReceiveJson();
	nlohmann::json ReceiveJsonMsgpack();

	// Дополнительные методы
	void ParseReceivedData();
	void ClearSecureBuffer();
protected:
	std::array<uint8_t, 32> m_aesKey;
	std::vector<uint8_t> m_encryptedData;
	std::array<uint8_t, 12> m_iv{};
	std::array<uint8_t, 16> m_tag{};
	uint32_t m_dataSize=0;

	void throw_openssl_error(const std::string& prefix);
	std::vector<uint8_t> AesEncrypt
	(
		const std::vector<uint8_t>& plainText,
		std::array<uint8_t, 12>& iv,
		std::array<uint8_t, 16>& tag
	);
	std::vector<uint8_t> AesDecrypt
	(
		const std::vector<uint8_t>& cipherText,
		const std::array<uint8_t, 12>& iv,
		const std::array<uint8_t, 16>& tag
	);


	bool ReceiveExact(void* buffer, size_t size);
};


