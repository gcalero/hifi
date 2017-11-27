//
//  bottomHudOptions.qml
//  interface/resources/qml/android
//
//  Created by Cristian Duarte & Gabriel Calero on 24 Nov 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtQuick.Layouts 1.3
import Qt.labs.settings 1.0
import "."
import "../../styles" as HifiStyles
import "../../styles-uit"
import "../../controls-uit" as HifiControlsUit
import "../../controls" as HifiControls
import ".."

Item {
    id: bottomHud

    property bool shown: true

    signal sendToScript(var message);

    HifiAndroidConstants { id: android }

    onShownChanged: {
        bottomHud.visible = shown;
    }

    function hide() {
        shown = false;
    }

	Rectangle {
        anchors.fill : parent
 		color: "transparent"
        //color: "#AAdd5544"
        Flow {
            id: flowMain
            spacing: 0
            flow: Flow.LeftToRight
            layoutDirection: Flow.LeftToRight
            anchors.fill: parent
            anchors.margins: 4

            Rectangle {
                id: hideButton
                height: android.dimen.headerHideWidth
                width: android.dimen.headerHideHeight
                color: "#00000000"
                //color: "#CC00FF00"
                anchors {
                    horizontalCenter: parent.horizontalCenter
                }
                Image {
                    id: hideIcon
                    source: "../../../icons/android/show-up.svg"
                    width: android.dimen.headerHideIconWidth
                    height: android.dimen.headerHideIconHeight
                    anchors {
                        horizontalCenter: parent.horizontalCenter
                        verticalCenter: parent.verticalCenter
                    }
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        sendToScript ({ method: "showUpBar" });
                    }
                }
            }
        }
        /*border.width: 1
        border.color: "red"
        radius: 20*/
	}

    Component.onCompleted: {
        width = 117+10;
        height = 60;
        x=Window.innerWidth/3 - width;
        y=Window.innerHeight/3 - height;
    }

}
