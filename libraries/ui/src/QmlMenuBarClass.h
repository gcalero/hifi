//
//  Created by Gabriel Calero & Cristian Duarte on Aug 25, 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#ifndef hifi_ui_QmlMenuBarClass_h
#define hifi_ui_QmlMenuBarClass_h

#include "QmlWindowClass.h"

class QmlMenuBarClass : public QmlWindowClass {
	Q_OBJECT
public: 
	QmlMenuBarClass(QString id);
	static QScriptValue constructor(QScriptContext* context, QScriptEngine* engine);

	/**jsdoc
     * Creates a new button, adds it to this and returns it.
     * @function QmlMenuBarClass#addButton
     * @param properties {Object} button properties 
     * @returns {TabletButtonProxy}
     */
    Q_INVOKABLE QObject* addButton(const QVariant& properties);

protected:
    QString qmlSource() const override { return menuId + ".qml"; }

    static std::mutex _mutex;
    static std::map<QString, QScriptValue> _menues;
private:
	QString menuId;

};

#endif
