//
//  Created by Bradley Austin Davis on 2015/08/08
//  Copyright 2015 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
#include "PluginManager.h"

#include <mutex>

#include <QtCore/QCoreApplication>
#include <QtCore/QDir>
#include <QtCore/QDebug>
#include <QtCore/QPluginLoader>

#include <DependencyManager.h>
#include <UserActivityLogger.h>

#include "RuntimePlugin.h"
#include "CodecPlugin.h"
#include "DisplayPlugin.h"
#include "InputPlugin.h"
#include "PluginLogging.h"


void PluginManager::setDisplayPluginProvider(const DisplayPluginProvider& provider) {
    _displayPluginProvider = provider;
}

void PluginManager::setInputPluginProvider(const InputPluginProvider& provider) {
    _inputPluginProvider = provider;
}

void PluginManager::setCodecPluginProvider(const CodecPluginProvider& provider) {
    _codecPluginProvider = provider;
}

void PluginManager::setInputPluginSettingsPersister(const InputPluginSettingsPersister& persister) {
    _inputSettingsPersister = persister;
}

PluginManagerPointer PluginManager::getInstance() {
    return DependencyManager::get<PluginManager>();
}

QString getPluginNameFromMetaData(QJsonObject object) {
    static const char* METADATA_KEY = "MetaData";
    static const char* NAME_KEY = "name";

    if (!object.contains(METADATA_KEY) || !object[METADATA_KEY].isObject()) {
        return QString();
    }

    auto metaDataObject = object[METADATA_KEY].toObject();

    if (!metaDataObject.contains(NAME_KEY) || !metaDataObject[NAME_KEY].isString()) {
        return QString();
    }

    return metaDataObject[NAME_KEY].toString();
}

QString getPluginIIDFromMetaData(QJsonObject object) {
    static const char* IID_KEY = "IID";

    if (!object.contains(IID_KEY) || !object[IID_KEY].isString()) {
        return QString();
    }

    return object[IID_KEY].toString();
}

QStringList preferredDisplayPlugins;
QStringList disabledDisplays;
QStringList disabledInputs;

bool isDisabled(QJsonObject metaData) {
    auto name = getPluginNameFromMetaData(metaData);
    auto iid = getPluginIIDFromMetaData(metaData);

    if (iid == DisplayProvider_iid) {
        return disabledDisplays.contains(name);
    } else if (iid == InputProvider_iid) {
        return disabledInputs.contains(name);
    }

    return false;
}

using Loader = QSharedPointer<QPluginLoader>;
using LoaderList = QList<Loader>;

const LoaderList& getLoadedPlugins() {
    static std::once_flag once;
    static LoaderList loadedPlugins;
    std::call_once(once, [&] {
#if defined(Q_OS_ANDROID)
        QString pluginPath = QCoreApplication::applicationDirPath() + "/";
#elif defined(Q_OS_MAC)
        QString pluginPath = QCoreApplication::applicationDirPath() + "/../PlugIns/";
#else
        QString pluginPath = QCoreApplication::applicationDirPath() + "/plugins/";
#endif
        QDir pluginDir(pluginPath);
        pluginDir.setSorting(QDir::Name);
        pluginDir.setFilter(QDir::Files);
        if (pluginDir.exists()) {
            qInfo() << "Loading runtime plugins from " << pluginPath;
#if defined(Q_OS_ANDROID)
            // Can be a better filter and those libs may have a better name to destinguish them from qt plugins
            // For android only, add daydream lib as a plugin too
            pluginDir.setNameFilters(QStringList() << "libplugins_lib*.so" << "libdaydream.so");
#endif
            auto candidates = pluginDir.entryList();
            for (auto plugin : candidates) {
                qCDebug(plugins) << "Attempting plugin" << qPrintable(plugin);
                QSharedPointer<QPluginLoader> loader(new QPluginLoader(pluginPath + plugin));

                if (isDisabled(loader->metaData())) {
                    qWarning() << "Plugin" << qPrintable(plugin) << "is disabled";
                    // Skip this one, it's disabled
                    continue;
                }

                if (loader->load()) {
                    qCDebug(plugins) << "Plugin" << qPrintable(plugin) << "loaded successfully";
                    loadedPlugins.push_back(loader);
                } else {
                    qCDebug(plugins) << "Plugin" << qPrintable(plugin) << "failed to load:";
                    qCDebug(plugins) << " " << qPrintable(loader->errorString());
                }
            }
        }
    });
    return loadedPlugins;
}

const CodecPluginList& PluginManager::getCodecPlugins() {
    static CodecPluginList codecPlugins;
    static std::once_flag once;
    std::call_once(once, [&] {
        codecPlugins = _codecPluginProvider();

        // Now grab the dynamic plugins
        for (auto loader : getLoadedPlugins()) {
            CodecProvider* codecProvider = qobject_cast<CodecProvider*>(loader->instance());
            if (codecProvider) {
                for (auto codecPlugin : codecProvider->getCodecPlugins()) {
                    if (codecPlugin->isSupported()) {
                        codecPlugins.push_back(codecPlugin);
                    }
                }
            }
        }

        for (auto plugin : codecPlugins) {
            plugin->setContainer(_container);
            plugin->init();

            qCDebug(plugins) << "init codec:" << plugin->getName();
        }
    });
    return codecPlugins;
}

const SteamClientPluginPointer PluginManager::getSteamClientPlugin() {
    static SteamClientPluginPointer steamClientPlugin;
    static std::once_flag once;
    std::call_once(once, [&] {
        // Now grab the dynamic plugins
        for (auto loader : getLoadedPlugins()) {
            SteamClientProvider* steamClientProvider = qobject_cast<SteamClientProvider*>(loader->instance());
            if (steamClientProvider) {
                steamClientPlugin = steamClientProvider->getSteamClientPlugin();
                break;
            }
        }
    });
    return steamClientPlugin;
}

const DisplayPluginList& PluginManager::getDisplayPlugins() {
    static std::once_flag once;
    static auto deviceAddedCallback = [](QString deviceName) {
        qCDebug(plugins) << "Added device: " << deviceName;
        UserActivityLogger::getInstance().connectedDevice("display", deviceName);
    };
    static auto subdeviceAddedCallback = [](QString pluginName, QString deviceName) {
        qCDebug(plugins) << "Added subdevice: " << deviceName;
        UserActivityLogger::getInstance().connectedDevice("display", pluginName + " | " + deviceName);
    };

    std::call_once(once, [&] {
        // Grab the built in plugins
        _displayPlugins = _displayPluginProvider();


        // Now grab the dynamic plugins
        for (auto loader : getLoadedPlugins()) {
            DisplayProvider* displayProvider = qobject_cast<DisplayProvider*>(loader->instance());
            if (displayProvider) {
                for (auto displayPlugin : displayProvider->getDisplayPlugins()) {
                    _displayPlugins.push_back(displayPlugin);
                }
            }
        }
        for (auto plugin : _displayPlugins) {
            connect(plugin.get(), &Plugin::deviceConnected, this, deviceAddedCallback, Qt::QueuedConnection);
            connect(plugin.get(), &Plugin::subdeviceConnected, this, subdeviceAddedCallback, Qt::QueuedConnection);
            plugin->setContainer(_container);
            plugin->init();
        }

    });
    return _displayPlugins;
}

void PluginManager::disableDisplayPlugin(const QString& name) {
    auto it = std::remove_if(_displayPlugins.begin(), _displayPlugins.end(), [&](const DisplayPluginPointer& plugin){
        return plugin->getName() == name;
    });
    _displayPlugins.erase(it, _displayPlugins.end());
}


const InputPluginList& PluginManager::getInputPlugins() {
    static std::once_flag once;
    static auto deviceAddedCallback = [](QString deviceName) {
        qCDebug(plugins) << "Added device: " << deviceName;
        UserActivityLogger::getInstance().connectedDevice("input", deviceName);
    };
    static auto subdeviceAddedCallback = [](QString pluginName, QString deviceName) {
        qCDebug(plugins) << "Added subdevice: " << deviceName;
        UserActivityLogger::getInstance().connectedDevice("input", pluginName + " | " + deviceName);
    };

    std::call_once(once, [&] {
        _inputPlugins = _inputPluginProvider();

        // Now grab the dynamic plugins
        for (auto loader : getLoadedPlugins()) {
            InputProvider* inputProvider = qobject_cast<InputProvider*>(loader->instance());
            if (inputProvider) {
                for (auto inputPlugin : inputProvider->getInputPlugins()) {
                    if (inputPlugin->isSupported()) {
                        _inputPlugins.push_back(inputPlugin);
                    }
                }
            }
        }

        for (auto plugin : _inputPlugins) {
            connect(plugin.get(), &Plugin::deviceConnected, this, deviceAddedCallback, Qt::QueuedConnection);
            connect(plugin.get(), &Plugin::subdeviceConnected, this, subdeviceAddedCallback, Qt::QueuedConnection);
            plugin->setContainer(_container);
            plugin->init();
        }
    });
    return _inputPlugins;
}

void PluginManager::setPreferredDisplayPlugins(const QStringList& displays) {
    preferredDisplayPlugins = displays;
}

DisplayPluginList PluginManager::getPreferredDisplayPlugins() {
    static DisplayPluginList displayPlugins;

    static std::once_flag once;
    std::call_once(once, [&] {
        // Grab the built in plugins
        auto plugins = getDisplayPlugins();

        for (auto pluginName : preferredDisplayPlugins) {
            auto it = std::find_if(plugins.begin(), plugins.end(), [&](DisplayPluginPointer plugin) {
                return plugin->getName() == pluginName;
            });
            if (it != plugins.end()) {
                displayPlugins.push_back(*it);
            }
        }
    });

    return displayPlugins;
}


void PluginManager::disableDisplays(const QStringList& displays) {
    disabledDisplays << displays;
}

void PluginManager::disableInputs(const QStringList& inputs) {
    disabledInputs << inputs;
}

void PluginManager::saveSettings() {
    _inputSettingsPersister(getInputPlugins());
}

void PluginManager::shutdown() {
    for (auto inputPlugin : getInputPlugins()) {
        if (inputPlugin->isActive()) {
            inputPlugin->deactivate();
        }
    }

    for (auto displayPlugins : getDisplayPlugins()) {
        if (displayPlugins->isActive()) {
            displayPlugins->deactivate();
        }
    }

    auto loadedPlugins = getLoadedPlugins();
    // Now grab the dynamic plugins
    for (auto loader : getLoadedPlugins()) {
        InputProvider* inputProvider = qobject_cast<InputProvider*>(loader->instance());
        if (inputProvider) {
            inputProvider->destroyInputPlugins();
        }
        DisplayProvider* displayProvider = qobject_cast<DisplayProvider*>(loader->instance());
        if (displayProvider) {
            displayProvider->destroyDisplayPlugins();
        }
    }
}
