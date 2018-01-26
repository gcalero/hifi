set(TARGET_NAME daydream)
AUTOSCRIBE_SHADER_LIB(gpu daydream)
setup_hifi_library(OpenGL)
link_hifi_libraries(shared plugins ui-plugins gl gpu ui render-utils display-plugins controllers input-plugins ${PLATFORM_GL_BACKEND})

target_opengl()

find_package (Qt5 COMPONENTS ${PLATFORM_QT_COMPONENTS})

if (ANDROID)
  target_link_libraries(${TARGET_NAME} ${PLATFORM_QT_LIBRARIES})
  target_googlevr()
endif()

GroupSources("src/daydream")
