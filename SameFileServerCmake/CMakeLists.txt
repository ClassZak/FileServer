cmake_minimum_required(VERSION 3.28)

set(CXX_STANDARD 23)

project(FilesServer VERSION 1.0
		DESCRIPTION "File Server"
		LANGUAGES CXX
)

add_definitions(-DSTATIC_CONCPP)


set(SOURCES
	${CMAKE_SOURCE_DIR}/src/main.cpp

	${CMAKE_SOURCE_DIR}/src/utils/functions.hpp
	${CMAKE_SOURCE_DIR}/src/utils/functions.cpp
)

add_executable(FilesServer
	${SOURCES}
)

include_directories(
	${CMAKE_SOURCE_DIR}/include
)



# Зависимости
# OpenSSL
find_package(OpenSSL 3.5.1 REQUIRED)
if(OpenSSL_FOUND)
	include_directories(${OPENSSL_INCLUDE_DIR})
	message(STATUS "Found OpenSSL ${OPENSSL_VERSION}")
	message(STATUS "OpenSSL INCLUDE_DIR ${OPENSSL_INCLUDE_DIR}")
endif()

# MySQL connector
if(NOT WIN32)
	find_path(MYSQL_CPP_CONNECTION_INCLUDE_DIR NAMES mysql/jdbc.h)
	find_library(MYSQL_CPP_CONNECTION_LIBRARY NAMES mysqlcppconn9)
	if(MYSQL_CPP_CONNECTION_INCLUDE_DIR AND MYSQL_CPP_CONNECTION_LIBRARY)
		set(MYSQL_CPP_CONNECTION_FOUND TRUE)
		message(STATUS "Found MySQL Connector/C++")
	else()
		message(FATAL_ERROR "MySQL Connector/C++ not found")
	endif()
elseif(WIN32)
	if(CMAKE_BUILD_TYPE STREQUAL "Debug")
		set(MYSQL_CONNECTOR_CPP_ROOT "G:/Programs/Libraries/mysql-connector-c++-9.4.0-winx64")
		find_path(MYSQL_CPP_CONNECTION_INCLUDE_DIR
			NAMES mysqlx/xdevapi.h
			PATHS "${MYSQL_CONNECTOR_CPP_ROOT}/include"
		)
		include_directories(${MYSQL_CPP_CONNECTION_INCLUDE_DIR})

		set(MYSQL_CONNECTOR_CPP_LIB_DIR_DEBUG "${MYSQL_CONNECTOR_CPP_ROOT}/lib64/debug/vs14")
		set(MYSQL_CONNECTOR_CPP_LIB_DIR "${MYSQL_CONNECTOR_CPP_ROOT}/lib64/vs14")
		set(MYSQL_CONNECTOR_DEBUG_LIBS
			"${MYSQL_CONNECTOR_CPP_LIB_DIR_DEBUG}/mysqlcppconn-static.lib"
			"${MYSQL_CONNECTOR_CPP_LIB_DIR_DEBUG}/mysqlcppconnx-static.lib"
		)
		set(MYSQL_CONNECTOR_RELEASE_LIBS
			"${MYSQL_CONNECTOR_CPP_LIB_DIR}/mysqlcppconn-static.lib"
			"${MYSQL_CONNECTOR_CPP_LIB_DIR}/mysqlcppconnx-static.lib"
		)
		if(MYSQL_CPP_CONNECTION_INCLUDE_DIR AND MYSQL_CONNECTOR_DEBUG_LIBS)
			set(MYSQL_CPP_CONNECTION_FOUND TRUE)
			message(STATUS "Found MySQL Connector/C++ Debug libraries")
		else()
			message(FATAL_ERROR "MySQL Connector/C++ Debug libraries not found")
		endif()

		if(MYSQL_CPP_CONNECTION_INCLUDE_DIR AND MYSQL_CONNECTOR_CPP_LIB_DIR_DEBUG)
			set(MYSQL_CPP_CONNECTION_FOUND TRUE)
			message(STATUS "Found MySQL Connector/C++ root dir: ${MYSQL_CONNECTOR_CPP_ROOT}")
			message(STATUS "Found MySQL Connector/C++ include dir: ${MYSQL_CPP_CONNECTION_INCLUDE_DIR}")
			message(STATUS "Found MySQL Connector/C++ library: ${MYSQL_CONNECTOR_CPP_LIB_DIR_DEBUG}")
		else()
			message(STATUS "Found MySQL Connector/C++ root dir: ${MYSQL_CONNECTOR_CPP_ROOT}")
			message(STATUS "Found MySQL Connector/C++ include dir: ${MYSQL_CPP_CONNECTION_INCLUDE_DIR}")
			message(STATUS "Found MySQL Connector/C++ library: ${MYSQL_CONNECTOR_CPP_LIB_DIR_DEBUG}")
			message(FATAL_ERROR "MySQL Connector/C++ not found. "
				"Include dir: ${MYSQL_CPP_CONNECTION_INCLUDE_DIR}, "
				"Library: ${MYSQL_CONNECTOR_CPP_LIB_DIR_DEBUG}")
		endif()
	else()
		set(MYSQL_CONNECTOR_CPP_ROOT "C:/Program Files/MySQL/MySQL Connector C++ 9.4")
		find_path(MYSQL_CPP_CONNECTION_INCLUDE_DIR
			NAMES mysqlx/xdevapi.h
			PATHS "${MYSQL_CONNECTOR_CPP_ROOT}/include"
		)
		include_directories(${MYSQL_CPP_CONNECTION_INCLUDE_DIR})

		set(MYSQL_CONNECTOR_CPP_LIB_DIR "${MYSQL_CONNECTOR_CPP_ROOT}/lib64/vs14")
		set(MYSQL_CONNECTOR_RELEASE_LIBS
			"${MYSQL_CONNECTOR_CPP_LIB_DIR}/mysqlcppconn-static.lib"
			"${MYSQL_CONNECTOR_CPP_LIB_DIR}/mysqlcppconnx-static.lib"
		)
		link_directories(MYSQL_CONNECTOR_CPP_LIB_DIR)

		if(MYSQL_CPP_CONNECTION_INCLUDE_DIR AND MYSQL_CONNECTOR_CPP_LIB_DIR)
			set(MYSQL_CPP_CONNECTION_FOUND TRUE)
			message(STATUS "Found MySQL Connector/C++ root dir: ${MYSQL_CONNECTOR_CPP_ROOT}")
			message(STATUS "Found MySQL Connector/C++ include dir: ${MYSQL_CPP_CONNECTION_INCLUDE_DIR}")
			message(STATUS "Found MySQL Connector/C++ library: ${MYSQL_CONNECTOR_CPP_LIB_DIR}")
		else()
			message(STATUS "Found MySQL Connector/C++ root dir: ${MYSQL_CONNECTOR_CPP_ROOT}")
			message(STATUS "Found MySQL Connector/C++ include dir: ${MYSQL_CPP_CONNECTION_INCLUDE_DIR}")
			message(STATUS "Found MySQL Connector/C++ library: ${MYSQL_CONNECTOR_CPP_LIB_DIR}")
			message(FATAL_ERROR "MySQL Connector/C++ not found. "
				"Include dir: ${MYSQL_CPP_CONNECTION_INCLUDE_DIR}, "
				"Library: ${MYSQL_CONNECTOR_CPP_LIB_DIR}")
		endif()
	endif()
endif()
# nlohmann/json
include(FetchContent)
FetchContent_Declare(json URL https://github.com/nlohmann/json/releases/download/v3.12.0/json.tar.xz)
FetchContent_MakeAvailable(json)
target_include_directories(FilesServer PRIVATE ${json_SOURCE_DIR}/include)
if(TARGET nlohmann_json::nlohmann_json)
	message(STATUS "Цель nlohmann_json найдена, отлично!")
else()
	message(FATAL_ERROR "Цель nlohmann_json не найдена! Проверьте загрузку через FetchContent.")
endif()
# Линковка
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
	target_link_libraries(FilesServer
		${MYSQL_CONNECTOR_DEBUG_LIBS}  # Debug-версии библиотек MySQL
		OpenSSL::SSL  # Импортированные цели OpenSSL
		OpenSSL::Crypto
		nlohmann_json::nlohmann_json
	)
else()
	target_link_libraries(FilesServer
		${MYSQL_CONNECTOR_RELEASE_LIBS} # Release-версии библиотек MySQL
		OpenSSL::SSL
		OpenSSL::Crypto
		nlohmann_json::nlohmann_json
	)
endif()



# Платформенно-специфичные настройки
if(WIN32)
	# Флаги для Windows 7
	if(CMAKE_SYSTEM_VERSION VERSION_EQUAL 6.1)
		add_compile_definitions(_WIN32_WINNT=0x0601)
		target_compile_options(${PROJECT_NAME} PRIVATE -O0)
	endif()
else()
	# Настройки для Linux/MacOS
	target_compile_options(${PROJECT_NAME} PRIVATE -O0)
endif()
# Настройки для MSVC (Windows 10/11)
if(MSVC)
	# Активация политики для Edit and Continue
	cmake_policy(SET CMP0141 NEW)
	target_compile_options(${PROJECT_NAME} PRIVATE "/std:c++latest")
	
	set_property(TARGET ${PROJECT_NAME} PROPERTY
		MSVC_DEBUG_INFORMATION_FORMAT "$<$<CONFIG:Debug>:EditAndContinue>"
	)
	set_target_properties(${PROJECT_NAME} PROPERTIES
		LINK_FLAGS_DEBUG "/INCREMENTAL"
	)
	
	# Флаги оптимизации
	target_compile_options(${PROJECT_NAME} PRIVATE
		"$<$<CONFIG:Debug>:/Od>"
	)
endif()
