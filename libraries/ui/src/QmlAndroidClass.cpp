//
//  Created by Gabriel Calero & Cristian Duarte on Aug 25, 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include "QmlAndroidClass.h"
#include <QtScript/QScriptContext>
#include <QtScript/QScriptEngine>
#include "OffscreenUi.h"

#include <QtCore/QThread>

std::mutex QmlAndroidClass::_mutex;
std::map<QString, QScriptValue> QmlAndroidClass::_menues;

QmlAndroidClass::QmlAndroidClass(QString id) : 
	qmlId(id) {
}
// Method called by Qt scripts to create a new bottom menu bar in Android
QScriptValue QmlAndroidClass::constructor(QScriptContext* context, QScriptEngine* engine) {

    std::lock_guard<std::mutex> guard(_mutex);
	auto qmlId = context->argument(0).toVariant().toMap().value("menuId");
	if (qmlId.isValid()) {
	    // look up tabletId in the map.
	    auto iter = _menues.find(qmlId.toString());
	    if (iter != _menues.end()) {
	    	//qDebug() << "[QML-ANDROID] QmlAndroidClass menu already exists";
	        return iter->second;
	    }
	} else {
		qWarning() << "QmlAndroidClass could not build instance";
		return NULL;
	}

    auto properties = parseArguments(context);
    QmlAndroidClass* retVal { nullptr };
    auto offscreenUi = DependencyManager::get<OffscreenUi>();
    offscreenUi->executeOnUiThread([&] {
        retVal = new QmlAndroidClass(qmlId.toString());
        retVal->initQml(properties);
    }, true);
    Q_ASSERT(retVal);
    connect(engine, &QScriptEngine::destroyed, retVal, &QmlWindowClass::deleteLater);
    QScriptValue scriptObject = engine->newQObject(retVal);
    _menues[qmlId.toString()] = scriptObject;
    return scriptObject;
}

void QmlAndroidClass::close() {
    QmlWindowClass::close();
    _menues.erase(qmlId);
}

QObject* QmlAndroidClass::addButton(const QVariant& properties) {
    QVariant resultVar;
    Qt::ConnectionType connectionType = Qt::AutoConnection;
    
    if (QThread::currentThread() != _qmlWindow->thread()) {
        connectionType = Qt::BlockingQueuedConnection;
    }
    bool hasResult = QMetaObject::invokeMethod(_qmlWindow, "addButton", connectionType,
                                               Q_RETURN_ARG(QVariant, resultVar), Q_ARG(QVariant, properties));
    if (!hasResult) {
        qWarning() << "QmlAndroidClass addButton has no result";
        return NULL;
    }

    QObject* qmlButton = qvariant_cast<QObject *>(resultVar);
    if (!qmlButton) {
        qWarning() << "QmlAndroidClass addButton result not a QObject";
        return NULL;
    }
    
    return qmlButton;
}

void QmlAndroidClass::removeButton(QObject* button) {
}
