set(TARGET_NAME daydream)
AUTOSCRIBE_SHADER_LIB(gpu daydream)
setup_hifi_library(OpenGL)
link_hifi_libraries(shared plugins ui-plugins gl gpu-gl ui render-utils display-plugins controllers input-plugins)

target_opengl()

if (ANDROID)
  set(PLATFORM_QT_COMPONENTS AndroidExtras)
  set(PLATFORM_QT_LIBRARIES Qt5::AndroidExtras)

  find_package (GVR)
  find_package (Qt5 COMPONENTS ${PLATFORM_QT_COMPONENTS})
  if (GVR_FOUND)
    include_directories(${GVR_INCLUDE_DIRS})
    target_link_libraries(${TARGET_NAME} ${GVR_LIBRARIES} ${PLATFORM_QT_LIBRARIES})

    # Expects the gvr-common library folder to be one level outside $ANDROID_APK_BUILD_DIR
    file(WRITE "${ANDROID_APK_BUILD_DIR}/project.properties" "# references\n")
    file(APPEND "${ANDROID_APK_BUILD_DIR}/project.properties" "android.library.reference.1=../gvr-common\n")
    file(APPEND "${ANDROID_APK_BUILD_DIR}/project.properties" "android.library.reference.2=../gvr-base\n")

  endif()
endif()

GroupSources("src/daydream")
