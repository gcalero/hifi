//
//  Created by Gabriel Calero & Cristian Duarte on Aug 25, 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include "QmlMenuBarClass.h"
#include <QtScript/QScriptContext>
#include <QtScript/QScriptEngine>
#include "OffscreenUi.h"


// Method called by Qt scripts to create a new bottom menu bar in Android
QScriptValue QmlMenuBarClass::constructor(QScriptContext* context, QScriptEngine* engine) {
    auto properties = parseArguments(context);
    QmlMenuBarClass* retVal { nullptr };
    auto offscreenUi = DependencyManager::get<OffscreenUi>();
    offscreenUi->executeOnUiThread([&] {
        retVal = new QmlMenuBarClass();
        retVal->initQml(properties);
    }, true);
    Q_ASSERT(retVal);
    connect(engine, &QScriptEngine::destroyed, retVal, &QmlWindowClass::deleteLater);
    return engine->newQObject(retVal);
}