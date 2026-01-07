#include <string>
#include <windows.h>
#include <winhttp.h>

#pragma comment(lib, "winhttp.lib")

namespace ShieldAuth {
    
    std::string HttpPost(const std::string& url, const std::string& path, const std::string& json) {
        std::wstring wUrl(url.begin(), url.end());
        std::wstring wPath(path.begin(), path.end());
        
        HINTERNET hSession = WinHttpOpen(
            L"ShieldAuth/1.0",
            WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
            WINHTTP_NO_PROXY_NAME,
            WINHTTP_NO_PROXY_BYPASS,
            0
        );
        
        if (!hSession) return "";
        
        HINTERNET hConnect = WinHttpConnect(
            hSession,
            wUrl.c_str(),
            INTERNET_DEFAULT_HTTPS_PORT,
            0
        );
        
        if (!hConnect) {
            WinHttpCloseHandle(hSession);
            return "";
        }
        
        HINTERNET hRequest = WinHttpOpenRequest(
            hConnect,
            L"POST",
            wPath.c_str(),
            NULL,
            WINHTTP_NO_REFERER,
            WINHTTP_DEFAULT_ACCEPT_TYPES,
            WINHTTP_FLAG_SECURE
        );
        
        if (!hRequest) {
            WinHttpCloseHandle(hConnect);
            WinHttpCloseHandle(hSession);
            return "";
        }
        
        LPCWSTR headers = L"Content-Type: application/json\r\n";
        
        BOOL result = WinHttpSendRequest(
            hRequest,
            headers,
            -1,
            (LPVOID)json.c_str(),
            json.length(),
            json.length(),
            0
        );
        
        if (!result) {
            WinHttpCloseHandle(hRequest);
            WinHttpCloseHandle(hConnect);
            WinHttpCloseHandle(hSession);
            return "";
        }
        
        WinHttpReceiveResponse(hRequest, NULL);
        
        DWORD bytesAvailable = 0;
        std::string response;
        
        do {
            bytesAvailable = 0;
            WinHttpQueryDataAvailable(hRequest, &bytesAvailable);
            
            if (bytesAvailable > 0) {
                char* buffer = new char[bytesAvailable + 1];
                DWORD bytesRead = 0;
                
                WinHttpReadData(hRequest, buffer, bytesAvailable, &bytesRead);
                buffer[bytesRead] = '\0';
                response += buffer;
                
                delete[] buffer;
            }
        } while (bytesAvailable > 0);
        
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        
        return response;
    }
}