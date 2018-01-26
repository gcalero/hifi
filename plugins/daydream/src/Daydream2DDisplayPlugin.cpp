//
//  Created by Gabriel Calero & Cristian Duarte on 2017/08/07
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
#include "Daydream2DDisplayPlugin.h"

#include <ui-plugins/PluginContainer.h>
#include <gpu/Batch.h>
#include <PathUtils.h>
#include <input-plugins/TouchscreenVirtualPadDevice.h>
#include "display-plugins/CompositorHelper.h"
#include "daydream/DaydreamHelpers.h"

const QString Daydream2DDisplayPlugin::NAME("Daydream2D");

bool __cameraIsFirstPersonMode = false;

bool Daydream2DDisplayPlugin::internalActivate() {
    _container->setFullscreen(nullptr, true);
    _framerateActions.clear();
    qDebug()<<"Daydream2DDisplayPlugin::internalActivate";

    return Parent::internalActivate();
}

bool Daydream2DDisplayPlugin::beginFrameRender(uint32_t frameIndex) {
    _currentRenderFrameInfo = FrameInfo();
    _currentRenderFrameInfo.sensorSampleTime = secTimestampNow();
    _currentRenderFrameInfo.predictedDisplayTime = _currentRenderFrameInfo.sensorSampleTime;
    // FIXME simulate head movement
    //_currentRenderFrameInfo.renderPose = ;
    //_currentRenderFrameInfo.presentPose = _currentRenderFrameInfo.renderPose;


    GvrState *gvrState = GvrState::getInstance();
    glm::quat orientation = toGlm(gvrState->_controller_state.GetOrientation());
    
    gvr::ClockTimePoint pred_time = gvr::GvrApi::GetTimePointNow();
    pred_time.monotonic_system_time_nanos += 50000000; // 50ms

    gvr::Mat4f head_view =
    gvrState->_gvr_api->GetHeadSpaceFromStartSpaceRotation(pred_time);

    glm::mat4 glmHeadView = glm::inverse(glm::make_mat4(&(MatrixToGLArray(head_view)[0])));
    _currentRenderFrameInfo.renderPose = glmHeadView;
    _currentRenderFrameInfo.presentPose = _currentRenderFrameInfo.renderPose;
    
    withNonPresentThreadLock([&] {
//        _uiModelTransform = DependencyManager::get<CompositorHelper>()->getModelTransform();
        _frameInfos[frameIndex] = _currentRenderFrameInfo;
        
    });
    return Parent::beginFrameRender(frameIndex);
}

void Daydream2DDisplayPlugin::updateFrameData() {
    //if (!__activityPaused) {
        Parent::updateFrameData();
    //} else {
//        _currentFrame = NULL;
    //}
}

glm::mat4 Daydream2DDisplayPlugin::getHeadPose() const {
    return _currentRenderFrameInfo.renderPose;
}

void _setCameraIsFirstPersonMode(bool isFirstPerson) {
    __cameraIsFirstPersonMode = isFirstPerson;
}