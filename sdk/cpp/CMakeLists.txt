cmake_minimum_required(VERSION 3.10)
project(ShieldAuth)

set(CMAKE_CXX_STANDARD 17)

# Try to find libcurl (optional - user must have it installed)
find_package(CURL QUIET)

if(CURL_FOUND)
    message(STATUS "Found CURL: ${CURL_LIBRARIES}")
else()
    message(WARNING "CURL not found - you'll need to link it manually")
    message(WARNING "Download from: https://curl.se/windows/")
endif()

# Build static library
add_library(shieldauth STATIC
    src/shieldauth.cpp
    src/hwid.cpp
    src/http.cpp
)

target_include_directories(shieldauth PUBLIC 
    include
)

if(CURL_FOUND)
    target_include_directories(shieldauth PUBLIC ${CURL_INCLUDE_DIRS})
    target_link_libraries(shieldauth ${CURL_LIBRARIES})
endif()

# Build example (optional)
option(BUILD_EXAMPLE "Build example executable" OFF)
if(BUILD_EXAMPLE)
    add_executable(example examples/example.cpp)
    target_link_libraries(example shieldauth)
endif()