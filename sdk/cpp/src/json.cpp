// Just enough JSON for ShieldAuth's flat request and response objects.

#include "shieldauth.h"

#include <cctype>
#include <cstdio>

namespace ShieldAuth {
namespace Detail {

std::string JsonEscape(const std::string& value) {
    std::string out;
    for (unsigned char c : value) {
        switch (c) {
            case '"': out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:
                if (c < 0x20) {
                    char buffer[8];
                    snprintf(buffer, sizeof(buffer), "\\u%04x", c);
                    out += buffer;
                } else {
                    out += static_cast<char>(c);
                }
        }
    }
    return out;
}

namespace {

void SkipSpace(const std::string& s, size_t& i) {
    while (i < s.size() && isspace(static_cast<unsigned char>(s[i]))) i++;
}

// Reads a JSON string starting at s[i] == '"'. Handles the escapes the
// server can produce; \u escapes outside ASCII are kept as UTF-8.
bool ReadString(const std::string& s, size_t& i, std::string& out) {
    if (i >= s.size() || s[i] != '"') return false;
    i++;
    out.clear();
    while (i < s.size() && s[i] != '"') {
        char c = s[i++];
        if (c != '\\') {
            out += c;
            continue;
        }
        if (i >= s.size()) return false;
        char e = s[i++];
        switch (e) {
            case 'n': out += '\n'; break;
            case 'r': out += '\r'; break;
            case 't': out += '\t'; break;
            case 'b': out += '\b'; break;
            case 'f': out += '\f'; break;
            case 'u': {
                if (i + 4 > s.size()) return false;
                unsigned int code = std::stoul(s.substr(i, 4), nullptr, 16);
                i += 4;
                if (code < 0x80) {
                    out += static_cast<char>(code);
                } else if (code < 0x800) {
                    out += static_cast<char>(0xC0 | (code >> 6));
                    out += static_cast<char>(0x80 | (code & 0x3F));
                } else {
                    out += static_cast<char>(0xE0 | (code >> 12));
                    out += static_cast<char>(0x80 | ((code >> 6) & 0x3F));
                    out += static_cast<char>(0x80 | (code & 0x3F));
                }
                break;
            }
            default: out += e;  // \" \\ \/
        }
    }
    if (i >= s.size()) return false;
    i++;  // closing quote
    return true;
}

}  // namespace

std::map<std::string, std::string> ParseFlatObject(const std::string& json) {
    std::map<std::string, std::string> result;
    size_t i = 0;
    SkipSpace(json, i);
    if (i >= json.size() || json[i] != '{') return {};
    i++;

    while (true) {
        SkipSpace(json, i);
        if (i < json.size() && json[i] == '}') break;
        std::string key;
        if (!ReadString(json, i, key)) return {};
        SkipSpace(json, i);
        if (i >= json.size() || json[i] != ':') return {};
        i++;
        SkipSpace(json, i);

        std::string value;
        if (i < json.size() && json[i] == '"') {
            if (!ReadString(json, i, value)) return {};
        } else {
            // number, true, false or null: keep the literal text
            size_t start = i;
            while (i < json.size() && json[i] != ',' && json[i] != '}' && !isspace(static_cast<unsigned char>(json[i]))) i++;
            value = json.substr(start, i - start);
            if (value.empty() || value[0] == '{' || value[0] == '[') return {};  // not flat
        }
        result[key] = value;

        SkipSpace(json, i);
        if (i < json.size() && json[i] == ',') {
            i++;
            continue;
        }
        if (i < json.size() && json[i] == '}') break;
        return {};
    }
    return result;
}

}  // namespace Detail
}  // namespace ShieldAuth
