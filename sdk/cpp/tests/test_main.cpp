// Offline tests: run with ctest. They check the SDK against the shared
// test vectors in sdk/test-vectors.json, so it agrees with the server.

#include "shieldauth.h"

#include <fstream>
#include <iostream>
#include <sstream>

using namespace ShieldAuth::Detail;

static int failures = 0;

static void Check(bool condition, const char* name) {
    std::cout << (condition ? "ok   " : "FAIL ") << name << "\n";
    if (!condition) failures++;
}

// The vectors file nests two flat objects; pull one out by name.
static std::map<std::string, std::string> Section(const std::string& file, const std::string& name) {
    size_t start = file.find("\"" + name + "\": {");
    if (start == std::string::npos) return {};
    start = file.find('{', start);
    size_t end = file.find('}', start);
    return ParseFlatObject(file.substr(start, end - start + 1));
}

int main(int argc, char** argv) {
    std::ifstream in(argc > 1 ? argv[1] : "test-vectors.json", std::ios::binary);
    std::stringstream buffer;
    buffer << in.rdbuf();
    const std::string file = buffer.str();
    Check(!file.empty(), "test vectors file is readable");

    // ParseFlatObject reads the top level too, apart from the nested parts.
    size_t keyStart = file.find("\"public_key_pem\"");
    std::string pemObject = "{" + file.substr(keyStart, file.find("\",", keyStart) - keyStart + 1) + "}";
    std::string pem = ParseFlatObject(pemObject)["public_key_pem"];
    Check(pem.find("BEGIN PUBLIC KEY") != std::string::npos, "public key parsed");

    auto v = Section(file, "validate");
    std::string text = CanonicalMessage("validate", {v["app_id"], v["license_key"], v["hwid"], v["nonce"],
                                                     v["valid"] == "true" ? "1" : "0", v["session_id"],
                                                     v["expires_at"], v["signed_at"]});
    Check(text == v["message"], "canonical validate text matches the server");
    Check(VerifySignature(pem, v["message"], v["signature"]), "validate signature verifies");
    Check(!VerifySignature(pem, v["message"] + "x", v["signature"]), "tampered validate text is rejected");

    auto h = Section(file, "heartbeat");
    Check(VerifySignature(pem, h["message"], h["signature"]), "heartbeat signature verifies");
    Check(!VerifySignature(pem, h["message"], v["signature"]), "signature for another message is rejected");
    Check(!VerifySignature("not a key", v["message"], v["signature"]), "garbage key is rejected");

    Check(Sha256Hex("abc") == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "SHA-256 known answer");
    Check(RandomNonce().size() == 24 && RandomNonce() != RandomNonce(), "nonces are 24 chars and random");

    auto parsed = ParseFlatObject("{\"a\":\"x\\\"y\\n\",\"b\":true,\"c\":null,\"d\":42}");
    Check(parsed["a"] == "x\"y\n" && parsed["b"] == "true" && parsed["c"] == "null" && parsed["d"] == "42",
          "flat JSON parsing");
    Check(JsonEscape("a\"b\\c\n") == "a\\\"b\\\\c\\n", "JSON escaping");

    ShieldAuth::Config config;
    Check(!ShieldAuth::Initialize(config), "Initialize rejects an empty config");
    config.app_id = "app";
    config.api_url = "https://example.invalid/api/v1";
    Check(!ShieldAuth::Initialize(config), "Initialize requires a public key");
    Check(ShieldAuth::GetHWID().size() == 64, "HWID is a SHA-256 hex digest");

    std::cout << (failures ? "FAILED\n" : "all passed\n");
    return failures ? 1 : 0;
}
