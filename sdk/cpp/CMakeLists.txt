cmake_minimum_required(VERSION 3.10)
project(ShieldAuth)

set(CMAKE_CXX_STANDARD 17)

# Build static library
add_library(shieldauth STATIC
    src/shieldauth.cpp
    src/hwid.cpp
    src/http.cpp
)

target_include_directories(shieldauth PUBLIC include)

# Build example
add_executable(example examples/example.cpp)
target_link_libraries(example shieldauth)