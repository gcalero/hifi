//
//  Created by Gabriel Calero & Cristian Duarte on Jan 25, 2018
//  Copyright 2018 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include <mutex>

#include <QtCore/QObject>
#include <QtCore/QtPlugin>
#include <QtCore/QStringList>

#include <plugins/RuntimePlugin.h>
#include <plugins/DisplayPlugin.h>
#include <plugins/InputPlugin.h>

#include "Daydream2DDisplayPlugin.h"

class DaydreamProvider : public QObject, public DisplayProvider, InputProvider
{
    Q_OBJECT
    Q_PLUGIN_METADATA(IID DisplayProvider_iid FILE "daydream.json")
    Q_INTERFACES(DisplayProvider)
    Q_PLUGIN_METADATA(IID InputProvider_iid FILE "daydream.json")
    Q_INTERFACES(InputProvider)

public:
    DaydreamProvider(QObject* parent = nullptr) : QObject(parent) {}
    virtual ~DaydreamProvider() {}

    virtual DisplayPluginList getDisplayPlugins() override {
        static std::once_flag once;
        std::call_once(once, [&] {
            DisplayPluginPointer plugin(new Daydream2DDisplayPlugin());
            if (plugin->isSupported()) {
                _displayPlugins.push_back(plugin);
            }
        });
        return _displayPlugins;
    }

    virtual InputPluginList getInputPlugins() override {
        static std::once_flag once;
        std::call_once(once, [&] {
            /*InputPluginPointer plugin(new DaydreamControllerManager());
            if (plugin->isSupported()) {
                _inputPlugins.push_back(plugin);
            }*/
        });
        return _inputPlugins;
    }

    virtual void destroyInputPlugins() override {
        _inputPlugins.clear();
    }

    virtual void destroyDisplayPlugins() override {
        _displayPlugins.clear();
    }

private:
    DisplayPluginList _displayPlugins;
    InputPluginList _inputPlugins;
};

#include "DaydreamProvider.moc"
