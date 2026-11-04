// SHA-256, random nonces and ECDSA P-256 verification through Windows CNG.

#include "shieldauth.h"

#include <windows.h>
#include <bcrypt.h>

#include <cstring>
#include <vector>

#pragma comment(lib, "bcrypt.lib")

namespace ShieldAuth {
namespace Detail {

namespace {

std::vector<unsigned char> Base64Decode(const std::string& text) {
    static const std::string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::vector<unsigned char> out;
    unsigned int buffer = 0;
    int bits = 0;
    for (char c : text) {
        if (c == '=' ) break;
        size_t value = alphabet.find(c);
        if (value == std::string::npos) continue;  // skip whitespace and line breaks
        buffer = (buffer << 6) | static_cast<unsigned int>(value);
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out.push_back(static_cast<unsigned char>((buffer >> bits) & 0xFF));
        }
    }
    return out;
}

// DER prefix of every P-256 SubjectPublicKeyInfo: SEQUENCE, the
// id-ecPublicKey and prime256v1 OIDs, then a BIT STRING holding 0x04 || X || Y.
const unsigned char kP256SpkiPrefix[] = {
    0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00, 0x04};

bool Sha256(const std::string& data, unsigned char out[32]) {
    return BCRYPT_SUCCESS(BCryptHash(BCRYPT_SHA256_ALG_HANDLE, nullptr, 0,
                                     (PUCHAR)data.data(), static_cast<ULONG>(data.size()), out, 32));
}

}  // namespace

std::string Sha256Hex(const std::string& data) {
    unsigned char digest[32];
    if (!Sha256(data, digest)) return "";
    static const char* hex = "0123456789abcdef";
    std::string out;
    for (unsigned char byte : digest) {
        out += hex[byte >> 4];
        out += hex[byte & 0xF];
    }
    return out;
}

std::string RandomNonce() {
    unsigned char bytes[18];
    if (!BCRYPT_SUCCESS(BCryptGenRandom(nullptr, bytes, sizeof(bytes), BCRYPT_USE_SYSTEM_PREFERRED_RNG))) return "";
    // base64url without padding (18 bytes -> 24 characters)
    static const char* alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    std::string out;
    for (size_t i = 0; i < sizeof(bytes); i += 3) {
        unsigned int n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        for (int shift = 18; shift >= 0; shift -= 6) out += alphabet[(n >> shift) & 0x3F];
    }
    return out;
}

bool VerifySignature(const std::string& public_key_pem, const std::string& message, const std::string& signature_b64) {
    // Strip the PEM armour lines and decode the DER.
    std::string body;
    size_t start = 0;
    while (start < public_key_pem.size()) {
        size_t end = public_key_pem.find('\n', start);
        if (end == std::string::npos) end = public_key_pem.size();
        std::string line = public_key_pem.substr(start, end - start);
        if (line.rfind("-----", 0) != 0) body += line;
        start = end + 1;
    }
    std::vector<unsigned char> der = Base64Decode(body);
    std::vector<unsigned char> signature = Base64Decode(signature_b64);
    if (der.size() != sizeof(kP256SpkiPrefix) + 64 || signature.size() != 64 ||
        memcmp(der.data(), kP256SpkiPrefix, sizeof(kP256SpkiPrefix)) != 0) {
        return false;
    }

    // BCRYPT_ECCKEY_BLOB header followed by X and Y.
    std::vector<unsigned char> blob(sizeof(BCRYPT_ECCKEY_BLOB) + 64);
    auto* header = reinterpret_cast<BCRYPT_ECCKEY_BLOB*>(blob.data());
    header->dwMagic = BCRYPT_ECDSA_PUBLIC_P256_MAGIC;
    header->cbKey = 32;
    memcpy(blob.data() + sizeof(BCRYPT_ECCKEY_BLOB), der.data() + sizeof(kP256SpkiPrefix), 64);

    unsigned char digest[32];
    if (!Sha256(message, digest)) return false;

    BCRYPT_KEY_HANDLE key = nullptr;
    if (!BCRYPT_SUCCESS(BCryptImportKeyPair(BCRYPT_ECDSA_P256_ALG_HANDLE, nullptr, BCRYPT_ECCPUBLIC_BLOB, &key,
                                            blob.data(), static_cast<ULONG>(blob.size()), 0))) {
        return false;
    }
    // CNG expects the raw r || s form, which is what the server sends.
    NTSTATUS status = BCryptVerifySignature(key, nullptr, digest, sizeof(digest), signature.data(),
                                            static_cast<ULONG>(signature.size()), 0);
    BCryptDestroyKey(key);
    return BCRYPT_SUCCESS(status);
}

}  // namespace Detail
}  // namespace ShieldAuth
