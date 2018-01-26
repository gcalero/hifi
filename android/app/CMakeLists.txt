set(TARGET_NAME native-lib)
setup_hifi_library()
link_hifi_libraries(shared networking gl gpu image fbx render-utils physics entities octree ${PLATFORM_GL_BACKEND})
target_opengl()
target_bullet()

set(INTERFACE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../interface")
add_subdirectory("${INTERFACE_DIR}" "libraries/interface")
include_directories("${INTERFACE_DIR}/src")

target_link_libraries(native-lib android log m interface)
target_googlevr()
target_link_libraries(native-lib ui)

# finished libraries
# core -> qt
# networking -> openssl, tbb
# fbx -> draco
# physics -> bullet
# entities-renderer -> polyvox

# unfinished libraries
# image -> nvtt (doesn't look good, but can be made optional)
# script-engine -> quazip (probably not required for the android client)


