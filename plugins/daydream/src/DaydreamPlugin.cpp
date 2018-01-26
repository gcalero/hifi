//
//  Created by Gabriel Calero & Cristian Duarte on 2017/08/07
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include <plugins/PluginManager.h>

#include <input-plugins/InputPlugin.h>

#include "Daydream2DDisplayPlugin.h"
#include <QtAndroidExtras/QAndroidJniObject>

gvr_context* __gvr_context;
//bool __vr_exit_requested;
//bool __activityPaused;
//QAndroidJniObject __activity;
/*
DaydreamLibInstance::DaydreamLibInstance(){
    static std::once_flag once;
    std::call_once(once, [&] {
        qDebug() << __FILE__ << "has been initialized";
        
        // FIXME - this is a bit of a hack, and not quite how we expect things to be done.
        // Specifically because the application should really be responsible for loading the
        // built in plugins, and any dynamic plugins like the Daydream plugin. I needed to
        // hack in these two different versions of loadDisplayPlugins() because the Built In
        // plugins are exposed as a DisplayPluginList
        DisplayPlugin* DISPLAY_PLUGIN_POOL[] = {
            new Android2DDisplayPlugin(),
            new DaydreamDisplayPlugin(),
            nullptr
        };
        // Temporarily stop using DaydreamDisplayPlugin for the Top-Down view implementation ("God View")
        PluginManager::getInstance()->loadDisplayPlugins(DISPLAY_PLUGIN_POOL);
        //DisplayPluginList builtInDisplayPlugins = getDisplayPlugins();
        //PluginManager::getInstance()->loadDisplayPlugins(builtInDisplayPlugins);

        InputPlugin* INPUT_PLUGIN_POOL[] = {
            new DaydreamControllerManager(),
            nullptr
        };
        PluginManager::getInstance()->loadInputPlugins(INPUT_PLUGIN_POOL);

        InputPluginList builtInInputPlugins = getInputPlugins();
        PluginManager::getInstance()->loadInputPlugins(builtInInputPlugins);
    });
  }
*/

 GvrState* GvrState::instance = nullptr;

 GvrState::GvrState(gvr_context *ctx) :
    _gvr_context(ctx),
    _gvr_api(gvr::GvrApi::WrapNonOwned(_gvr_context)),
    _viewport_list(_gvr_api->CreateEmptyBufferViewportList()) {

}

void GvrState::init(gvr_context *ctx)
{
    if (ctx && !instance) {
        instance = new GvrState(ctx);
    }
}

GvrState * GvrState::getInstance()
{
    return instance;            
}
