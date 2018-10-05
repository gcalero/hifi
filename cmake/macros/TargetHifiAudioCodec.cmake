#
#  Copyright 2015 High Fidelity, Inc.
#  Created by Bradley Austin Davis on 2015/10/10
#
#  Distributed under the Apache License, Version 2.0.
#  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
#
macro(TARGET_HIFIAUDIOCODEC)
    if (ANDROID)
        set(HIFIAC_INSTALL_DIR ${HIFI_ANDROID_PRECOMPILED}/hifiAC/codecSDK)
        set(HIFIAC_LIB_DIR "${HIFIAC_INSTALL_DIR}/Release")
        set(HIFIAC_INCLUDE_DIRS "${HIFIAC_INSTALL_DIR}/include" CACHE TYPE INTERNAL)
        set(HIFIAC_LIBRARIES ${HIFIAC_LIBS} CACHE TYPE INTERNAL)
    else()
        add_dependency_external_projects(hifiAudioCodec)
        target_include_directories(${TARGET_NAME} PRIVATE ${HIFIAUDIOCODEC_INCLUDE_DIRS})
        target_link_libraries(${TARGET_NAME} ${HIFIAUDIOCODEC_LIBRARIES})
    endif()

    target_include_directories(${TARGET_NAME} PRIVATE ${HIFIAC_INCLUDE_DIRS})
    target_link_libraries(${TARGET_NAME} ${HIFIAC_LIBRARIES})
endmacro()
