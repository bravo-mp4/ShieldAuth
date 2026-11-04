cmake_minimum_required(VERSION 3.16)
project(ShieldAuth CXX)

if(NOT WIN32)
    message(FATAL_ERROR "The ShieldAuth C++ SDK uses WinHTTP and CNG and builds on Windows only.")
endif()

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
# Static runtime, so apps don't need the VC++ redistributable.
set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")

add_library(shieldauth STATIC
    src/shieldauth.cpp
    src/crypto.cpp
    src/http.cpp
    src/hwid.cpp
    src/json.cpp
)
target_include_directories(shieldauth PUBLIC include)
# Windows 10+: CNG pseudo-handles and BCryptHash.
target_compile_definitions(shieldauth PUBLIC _WIN32_WINNT=0x0A00 WIN32_LEAN_AND_MEAN NOMINMAX)
target_link_libraries(shieldauth PUBLIC winhttp bcrypt advapi32)
if(MSVC)
    target_compile_options(shieldauth PRIVATE /W4 /permissive-)
endif()

add_executable(shieldauth_example examples/example.cpp)
target_link_libraries(shieldauth_example PRIVATE shieldauth)

enable_testing()
add_executable(shieldauth_tests tests/test_main.cpp)
target_link_libraries(shieldauth_tests PRIVATE shieldauth)
add_test(NAME shieldauth_tests
         COMMAND shieldauth_tests ${CMAKE_CURRENT_SOURCE_DIR}/../test-vectors.json)
