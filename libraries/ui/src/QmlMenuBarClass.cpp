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

#include <QtCore/QThread>

std::mutex QmlMenuBarClass::_mutex;
std::map<QString, QScriptValue> QmlMenuBarClass::_menues;

QmlMenuBarClass::QmlMenuBarClass(QString id) : 
	menuId(id) {
}
// Method called by Qt scripts to create a new bottom menu bar in Android
QScriptValue QmlMenuBarClass::constructor(QScriptContext* context, QScriptEngine* engine) {

    std::lock_guard<std::mutex> guard(_mutex);
	auto menuId = context->argument(0).toVariant().toMap().value("menuId");
	if (menuId.isValid()) {
	    // look up tabletId in the map.
	    auto iter = _menues.find(menuId.toString());
	    if (iter != _menues.end()) {
	    	//qDebug() << "[MENU] QmlMenuBarClass menu already exists";
	        return iter->second;
	    }
	} else {
		qWarning() << "QmlMenuBarClass could not build instance";
		return NULL;
	}

    auto properties = parseArguments(context);
    QmlMenuBarClass* retVal { nullptr };
    auto offscreenUi = DependencyManager::get<OffscreenUi>();
    offscreenUi->executeOnUiThread([&] {
        retVal = new QmlMenuBarClass(menuId.toString());
        retVal->initQml(properties);
    }, true);
    Q_ASSERT(retVal);
    connect(engine, &QScriptEngine::destroyed, retVal, &QmlWindowClass::deleteLater);
    QScriptValue scriptObject = engine->newQObject(retVal);
    _menues[menuId.toString()] = scriptObject;
    //qDebug() << "[MENU] QmlMenuBarClass new menu object for key " << menuId.toString();
    return scriptObject;
}

QObject* QmlMenuBarClass::addButton(const QVariant& properties) {
    QVariant resultVar;
    Qt::ConnectionType connectionType = Qt::AutoConnection;
    
    if (QThread::currentThread() != _qmlWindow->thread()) {
        connectionType = Qt::BlockingQueuedConnection;
    }
    bool hasResult = QMetaObject::invokeMethod(_qmlWindow, "addButton", connectionType,
                                               Q_RETURN_ARG(QVariant, resultVar), Q_ARG(QVariant, properties));
    if (!hasResult) {
        qWarning() << "QmlMenuBarClass addButton has no result";
        return NULL;
    }

    QObject* qmlButton = qvariant_cast<QObject *>(resultVar);
    if (!qmlButton) {
        qWarning() << "QmlMenuBarClass addButton result not a QObject";
        return NULL;
    }
    
    return qmlButton;
}

void QmlMenuBarClass::removeButton(QObject* tabletButtonProxy) {
}
