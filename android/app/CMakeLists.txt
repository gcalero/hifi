set(TARGET_NAME native-lib)
set(BUILD_CLIENT FALSE)
setup_hifi_library()
#link_hifi_libraries(shared)
#link_hifi_libraries(shared task networking gl gpu qml image fbx render-utils physics entities octree ${PLATFORM_GL_BACKEND})
#target_opengl()
#target_bullet()

#set(INTERFACE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../interface")
#add_subdirectory("${INTERFACE_DIR}" "libraries/interface")
set(HIFI_CODEC_PLUGIN_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../plugins/hifiCodec")
MESSAGE(STATUS, "HIFI CODEC DIR ${HIFI_CODEC_PLUGIN_DIR}")
add_subdirectory("${HIFI_CODEC_PLUGIN_DIR}" "libraries/hifiCodecPlugin")
#include_directories("${INTERFACE_DIR}/src")

target_link_libraries(native-lib android log m)

#add_dependencies(${TARGET_NAME} hifiCodec)

set(GVR_ROOT "${HIFI_ANDROID_PRECOMPILED}/gvr/gvr-android-sdk-1.101.0/")
target_include_directories(native-lib PRIVATE  "${GVR_ROOT}/libraries/headers")
target_link_libraries(native-lib "${GVR_ROOT}/libraries/libgvr.so")
#target_include_directories(native-lib PRIVATE  "${GVR_ROOT}/libraries/headers" "libraries/ui/src")
#target_link_libraries(native-lib "${GVR_ROOT}/libraries/libgvr.so" ui)

# finished libraries
# core -> qt
# networking -> openssl, tbb
# fbx -> draco
# physics -> bullet
# entities-renderer -> polyvox

# unfinished libraries
# image -> nvtt (doesn't look good, but can be made optional)
# script-engine -> quazip (probably not required for the android client)


