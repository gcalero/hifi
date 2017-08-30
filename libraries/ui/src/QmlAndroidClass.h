//
//  Created by Gabriel Calero & Cristian Duarte on Aug 25, 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#ifndef hifi_ui_QmlAndroidClass_h
#define hifi_ui_QmlAndroidClass_h

#include "QmlWindowClass.h"

class QmlAndroidClass : public QmlWindowClass {
	Q_OBJECT
public: 
	QmlAndroidClass(QString id);
	static QScriptValue constructor(QScriptContext* context, QScriptEngine* engine);

	/**jsdoc
     * Creates a new button, adds it to this and returns it.
     * @function QmlAndroidClass#addButton
     * @param properties {Object} button properties 
     * @returns {TabletButtonProxy}
     */
    Q_INVOKABLE QObject* addButton(const QVariant& properties);

    /*
     * TODO - not yet implemented
     */
    Q_INVOKABLE void removeButton(QObject* tabletButtonProxy);

protected:
    QString qmlSource() const override { return qmlId + ".qml"; }

    static std::mutex _mutex;
    static std::map<QString, QScriptValue> _menues;
private:
	QString qmlId;

};

#endif
