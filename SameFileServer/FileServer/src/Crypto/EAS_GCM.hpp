#pragma once
#include <openssl/evp.h>
#include <vector>
#include <array>
#include <stdexcept>

class AES_GCM
{
public:
	static constexpr size_t KEY_SIZE = 32;
	static constexpr size_t IV_SIZE = 12;
	static constexpr size_t TAG_SIZE = 16;
private:
	std::array<uint8_t, KEY_SIZE> key;



	AES_GCM(const std::array<uint8_t, KEY_SIZE>& key) : key(key) {}

	std::vector<uint8_t> encrypt(const uint8_t* plaintext, size_t len, const uint8_t* iv, uint8_t* tag)
	{
		EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
		if (!ctx)
			throw std::runtime_error("Failed to create context");

		std::vector<uint8_t> ciphertext(len + EVP_MAX_BLOCK_LENGTH);
		int out_len = 0, ciphertext_len = 0;

		if (1 != EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL))
			throw std::runtime_error("Encryption init failed");

		if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, IV_SIZE, NULL))
			throw std::runtime_error("IV length set failed");

		if (1 != EVP_EncryptInit_ex(ctx, NULL, NULL, key.data(), iv))
			throw std::runtime_error("Encryption key/IV setup failed");

		if (1 != EVP_EncryptUpdate(ctx, ciphertext.data(), &out_len, plaintext, len))
			throw std::runtime_error("Encryption failed");
		ciphertext_len = out_len;

		if (1 != EVP_EncryptFinal_ex(ctx, ciphertext.data() + out_len, &out_len))
			throw std::runtime_error("Encryption finalization failed");
		ciphertext_len += out_len;

		if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, TAG_SIZE, tag))
			throw std::runtime_error("Tag get failed");

		EVP_CIPHER_CTX_free(ctx);
		ciphertext.resize(ciphertext_len);
		return ciphertext;
	}

	std::vector<uint8_t> decrypt(const uint8_t* ciphertext, size_t len, const uint8_t* iv, const uint8_t* tag)
	{
		EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
		if (!ctx)
			throw std::runtime_error("Failed to create context");

		std::vector<uint8_t> plaintext(len + EVP_MAX_BLOCK_LENGTH);
		int out_len = 0, plaintext_len = 0;

		if (1 != EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL))
			throw std::runtime_error("Decryption init failed");

		if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, IV_SIZE, NULL))
			throw std::runtime_error("IV length set failed");

		if (1 != EVP_DecryptInit_ex(ctx, NULL, NULL, key.data(), iv))
			throw std::runtime_error("Decryption key/IV setup failed");

		if (1 != EVP_DecryptUpdate(ctx, plaintext.data(), &out_len, ciphertext, len))
			throw std::runtime_error("Decryption failed");
		plaintext_len = out_len;

		if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, TAG_SIZE, (void*)tag))
			throw std::runtime_error("Tag set failed");

		int ret = EVP_DecryptFinal_ex(ctx, plaintext.data() + out_len, &out_len);
		plaintext_len += out_len;

		EVP_CIPHER_CTX_free(ctx);

		if (ret <= 0) // 0 = проверка тега не удалась
			throw std::runtime_error("Tag verification failed");

		plaintext.resize(plaintext_len);
		return plaintext;
	}
};