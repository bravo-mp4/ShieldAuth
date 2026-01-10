cmake_minimum_required(VERSION 3.10)
project(ShieldAuth)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Force exact settings to match VS2022 v143 /MT (static runtime for better compatibility)
if(MSVC)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /std:c++17 /permissive- /EHsc")
    set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /MT")
    set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} /MTd")
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

add_library(shieldauth STATIC
    src/shieldauth.cpp
    src/hwid.cpp
    src/http.cpp
)

target_include_directories(shieldauth PUBLIC include)

# Ensure symbols are exported in static library
if(MSVC)
    target_compile_options(shieldauth PRIVATE /W3)
    set_target_properties(shieldauth PROPERTIES
        STATIC_LIBRARY_FLAGS "/LTCG:OFF"
    )
endif()

if(WIN32)
    target_link_libraries(shieldauth winhttp iphlpapi)
endif()