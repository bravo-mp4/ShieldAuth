// HTTPS (or plain HTTP for local development) POST through WinHTTP.

#include <windows.h>
#include <winhttp.h>

#include <string>
#include <vector>

#pragma comment(lib, "winhttp.lib")

namespace ShieldAuth {
namespace Detail {

namespace {

std::wstring Widen(const std::string& text) {
    if (text.empty()) return L"";
    int size = MultiByteToWideChar(CP_UTF8, 0, text.data(), static_cast<int>(text.size()), nullptr, 0);
    std::wstring out(size, L'\0');
    MultiByteToWideChar(CP_UTF8, 0, text.data(), static_cast<int>(text.size()), &out[0], size);
    return out;
}

struct Handle {
    HINTERNET h = nullptr;
    ~Handle() {
        if (h) WinHttpCloseHandle(h);
    }
};

}  // namespace

// Returns the response body, or an empty string on a network error.
// status receives the HTTP status code (0 on failure).
std::string HttpPost(const std::string& url, const std::string& body, int& status) {
    status = 0;
    std::wstring wideUrl = Widen(url);

    URL_COMPONENTS parts = {};
    parts.dwStructSize = sizeof(parts);
    wchar_t host[256] = {};
    wchar_t path[2048] = {};
    parts.lpszHostName = host;
    parts.dwHostNameLength = ARRAYSIZE(host);
    parts.lpszUrlPath = path;
    parts.dwUrlPathLength = ARRAYSIZE(path);
    if (!WinHttpCrackUrl(wideUrl.c_str(), 0, 0, &parts)) return "";

    Handle session, connect, request;
    session.h = WinHttpOpen(L"shieldauth-cpp/2.0", WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY, WINHTTP_NO_PROXY_NAME,
                            WINHTTP_NO_PROXY_BYPASS, 0);
    if (!session.h) return "";
    WinHttpSetTimeouts(session.h, 10000, 10000, 10000, 10000);

    connect.h = WinHttpConnect(session.h, host, parts.nPort, 0);
    if (!connect.h) return "";

    DWORD flags = parts.nScheme == INTERNET_SCHEME_HTTPS ? WINHTTP_FLAG_SECURE : 0;
    request.h = WinHttpOpenRequest(connect.h, L"POST", path, nullptr, WINHTTP_NO_REFERER,
                                   WINHTTP_DEFAULT_ACCEPT_TYPES, flags);
    if (!request.h) return "";

    // WinHTTP validates HTTPS certificates by default; nothing here turns that off.
    const wchar_t* headers = L"Content-Type: application/json\r\n";
    if (!WinHttpSendRequest(request.h, headers, static_cast<DWORD>(-1), (LPVOID)body.data(),
                            static_cast<DWORD>(body.size()), static_cast<DWORD>(body.size()), 0) ||
        !WinHttpReceiveResponse(request.h, nullptr)) {
        return "";
    }

    DWORD code = 0;
    DWORD size = sizeof(code);
    WinHttpQueryHeaders(request.h, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, WINHTTP_HEADER_NAME_BY_INDEX,
                        &code, &size, WINHTTP_NO_HEADER_INDEX);
    status = static_cast<int>(code);

    std::string response;
    DWORD available = 0;
    while (WinHttpQueryDataAvailable(request.h, &available) && available > 0) {
        std::vector<char> buffer(available);
        DWORD read = 0;
        if (!WinHttpReadData(request.h, buffer.data(), available, &read) || read == 0) break;
        response.append(buffer.data(), read);
        if (response.size() > 64 * 1024) return "";  // answers are tiny; refuse anything huge
    }
    return response;
}

}  // namespace Detail
}  // namespace ShieldAuth
