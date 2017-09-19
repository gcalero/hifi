//
//  Created by Gabriel Calero & Cristian Duarte on 2017/08/07
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
#include "Android2DDisplayPlugin.h"
#include "daydream/DaydreamHelpers.h"
#include <ui-plugins/PluginContainer.h>

#include <gpu/Batch.h>
#include <PathUtils.h>
#include <input-plugins/TouchscreenVirtualPadDevice.h>

#include "display-plugins/CompositorHelper.h"

const QString Android2DDisplayPlugin::NAME("Android");



bool Android2DDisplayPlugin::internalActivate() {
    _container->setFullscreen(nullptr, true);
    _framerateActions.clear();
    qDebug()<<"Android2DDisplayPlugin::internalActivate";

    return Parent::internalActivate();
}

void Android2DDisplayPlugin::customizeContext() {
    auto iconPath = PathUtils::resourcesPath() + "images/analog_stick.png";
    auto image = QImage(iconPath);
    if (image.format() != QImage::Format_ARGB32) {
        image = image.convertToFormat(QImage::Format_ARGB32);
    }
    if ((image.width() > 0) && (image.height() > 0)) {
        _stickTexture.reset(
            gpu::Texture::create2D(
            gpu::Element(gpu::VEC4, gpu::NUINT8, gpu::RGBA),
            image.width(), image.height(),
            gpu::Sampler(gpu::Sampler::FILTER_MIN_MAG_MIP_LINEAR)));
        _stickTexture->setSource("cursor texture");
        auto usage = gpu::Texture::Usage::Builder().withColor().withAlpha();
        _stickTexture->setUsage(usage.build());
        _stickTexture->assignStoredMip(0, gpu::Element(gpu::VEC4, gpu::NUINT8, gpu::RGBA), image.byteCount(), image.constBits());
    }

    iconPath = PathUtils::resourcesPath() + "images/analog_stick_base.png";
    image = QImage(iconPath);
    if (image.format() != QImage::Format_ARGB32) {
        image = image.convertToFormat(QImage::Format_ARGB32);
    }
    if ((image.width() > 0) && (image.height() > 0)) {
        _stickBaseTexture.reset(
            gpu::Texture::create2D(
            gpu::Element(gpu::VEC4, gpu::NUINT8, gpu::RGBA),
            image.width(), image.height(), 
            gpu::Sampler(gpu::Sampler::FILTER_MIN_MAG_MIP_LINEAR)));
        _stickTexture->setSource("cursor texture");
        auto usage = gpu::Texture::Usage::Builder().withColor().withAlpha();
        _stickBaseTexture->setUsage(usage.build());
        _stickBaseTexture->assignStoredMip(0, gpu::Element(gpu::VEC4, gpu::NUINT8, gpu::RGBA), image.byteCount(), image.constBits());
    }


    Parent::customizeContext();
}

bool Android2DDisplayPlugin::beginFrameRender(uint32_t frameIndex) {
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

void Android2DDisplayPlugin::updateFrameData() {
    if (!__activityPaused) {
        Parent::updateFrameData();
    } else {
        _currentFrame = NULL;
    }
}

glm::mat4 Android2DDisplayPlugin::getHeadPose() const {
    return _currentRenderFrameInfo.renderPose;
}


void Android2DDisplayPlugin::compositeExtra() {
    if(_touchVPadLeft()) {
        // render stick base
        auto stickBaseTransform = DependencyManager::get<CompositorHelper>()->getPoint2DTransform(_touchVPadFirstLeft());
        render([&](gpu::Batch& batch) {
            batch.enableStereo(false);
            batch.setProjectionTransform(mat4());
            batch.setPipeline(_cursorPipeline);
            batch.setResourceTexture(0, _stickBaseTexture);
            batch.resetViewTransform();
            batch.setModelTransform(stickBaseTransform);
            batch.setViewportTransform(ivec4(uvec2(0), getRecommendedRenderSize()));
            batch.draw(gpu::TRIANGLE_STRIP, 4);
        });
        // render stick head
        auto stickTransform = DependencyManager::get<CompositorHelper>()->getPoint2DTransform(_touchVPadCurrentLeft());
        render([&](gpu::Batch& batch) {
            batch.enableStereo(false);
            batch.setProjectionTransform(mat4());
            batch.setPipeline(_cursorPipeline);
            batch.setResourceTexture(0, _stickTexture);
            batch.resetViewTransform();
            batch.setModelTransform(stickTransform);
            batch.setViewportTransform(ivec4(uvec2(0), getRecommendedRenderSize()));
            batch.draw(gpu::TRIANGLE_STRIP, 4);
        });
    }

}