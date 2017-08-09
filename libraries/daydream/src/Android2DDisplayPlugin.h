//
//  Created by Gabriel Calero & Cristian Duarte on 2017/08/07
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
#pragma once

#include "display-plugins/Basic2DWindowOpenGLDisplayPlugin.h"
#include "DaydreamPlugin.h"

const float TARGET_FRAMERATE_Android2DWindowOpenGL = 60.0f;

class QScreen;
class QAction;

class Android2DDisplayPlugin : public Basic2DWindowOpenGLDisplayPlugin {
    Q_OBJECT
    using Parent = Basic2DWindowOpenGLDisplayPlugin;
public:
    virtual const QString getName() const override { return NAME; }
    bool isHmd() const override final { return false; }
    bool isStereo() const { return false; }
    virtual float getTargetFrameRate() const override { return  _framerateTarget ? (float) _framerateTarget : TARGET_FRAMERATE_Basic2DWindowOpenGL; }

    virtual bool internalActivate() override;
    bool beginFrameRender(uint32_t frameIndex) override;

    glm::uvec2 getRecommendedUiSize() const override {
        auto renderSize = getRecommendedRenderSize();
        //return glm::uvec2(renderSize.x/2, renderSize.y/2);
        return glm::uvec2(renderSize.x/3, renderSize.y/3);
        //return renderSize;
    }

    virtual glm::mat4 getHeadPose() const override;


protected:
    struct FrameInfo {
        mat4 renderPose;
        mat4 presentPose;
        double sensorSampleTime { 0 };
        double predictedDisplayTime { 0 };
        mat3 presentReprojection;
    };
    
    QMap<uint32_t, FrameInfo> _frameInfos;
    FrameInfo _currentRenderFrameInfo;


private:
    static const QString NAME;
    std::vector<QAction*> _framerateActions;
	uint32_t _framerateTarget { 0 };

};
