//
//  avatarSelection.qml
//  interface/resources/qml/android
//
//  Created by Gabriel Calero & Cristian Duarte on 21 Sep 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
import QtQuick 2.5
import QtQuick.Layouts 1.3
import Hifi 1.0

import "../../styles"
import ".."
import "../../styles-uit" as HifiStyles


Item {

	id: top

    signal sendToScript(var message);

    property bool shown: true

    onShownChanged: {
        top.visible = shown;
    }
    
	x: 10
    y: 10

    width: parent ? parent.width - 20 : 0
	height: parent ? parent.height - 60 : 0

    HifiConstants { id: hifi }
    HifiStyles.HifiConstants { id: hifiStyleConstants }

    function hide() {
        shown = false;
    }

    Rectangle {
        default property alias data: grid.data

        //implicitWidth: grid.implicitWidth + 40
        //implicitHeight: grid.implicitHeight + 40

        width: parent ? parent.width : 0
        height: parent ? parent.height : 0

        gradient: Gradient {
            GradientStop { position: 0.0; color: "#4E4E4E"  }
            GradientStop { position: 1.0; color: "#242424" }
        }
        Layout.alignment: Qt.AlignVCenter | Qt.AlignHCenter
        anchors { horizontalCenter: parent.horizontalCenter; verticalCenter: parent.verticalCenter }

        Image {
            id: windowIcon
            source: "../../../icons/android/avatar-i.svg"
            x: 20 * 19 / 16
            y: 20 * 19 / 16
            width: 55
            height: 55
        }

        HifiStyles.FiraSansRegular {
            id: windowTitle
            x: windowIcon.x + 75
            anchors.verticalCenter: windowIcon.verticalCenter
            text: "AVATAR"
            color: "#FFFFFF"
            font.pixelSize: hifi.fonts.headerPixelSize * 0.75
        }

        Rectangle {
            id: hideButton
            height: 50
            width: 50
            color: "#00000000"
            anchors {
                top: windowIcon.top
                right: parent.right
                rightMargin: 20 * 21 / 16;
            }
            Image {
                id: hideIcon
                source: "../../../icons/android/hide.svg"
                anchors {
                    right: parent.right
                    horizontalCenter: parent.horizontalCenter
                }
            }
            HifiStyles.FiraSansRegular {
                anchors {
                    top: hideIcon.bottom
                    horizontalCenter: hideIcon.horizontalCenter
                    topMargin: 12
                }
                text: "HIDE"
                color: "#FFFFFF"
                font.pixelSize: hifi.fonts.pixelSize * 0.75
            }

            MouseArea {
                anchors.fill: parent
                onClicked: {
                    hide();
                }
            }
        }

        GridLayout {
            id: grid
            columnSpacing: 30
            rowSpacing: 30
            columns: 3
            Layout.alignment: Qt.AlignVCenter | Qt.AlignHCenter
            anchors {
                horizontalCenter: parent.horizontalCenter
                verticalCenter: parent.verticalCenter
                top: windowIcon.bottom
            }
        }
    }

    function escapeRegExp(str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }
    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    }

    function addAvatar(name, thumbnailUrl, avatarUrl) {
        // create object
        var template = '
            import QtQuick.Layouts 1.3
            import QtQuick 2.5


            ColumnLayout {
                id: itemRoot
                spacing: 4
                signal sendToParentQml(var message);

                Image {
                    id: itemImage
                    Layout.preferredWidth: 192
                    Layout.preferredHeight: 108
                    source: "##THUMBNAIL_URL##"
                    asynchronous: true
                    fillMode: Image.PreserveAspectFit

                    MouseArea {
                        id: itemArea
                        anchors.fill: parent
                        hoverEnabled: true
                        enabled: true
                        onClicked: { sendToParentQml({ method: "selectAvatar", params: { avatarUrl: "##AVATAR_URL##" } }); }
                    }

                }

                Text {
                    id: itemName
                    text: "##NAME##"
                    color: "#1398BB"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.pointSize: 5
                    wrapMode: Text.WordWrap
                    width: parent
                    MouseArea {
                        id: itemNameArea
                        anchors.fill: parent
                        hoverEnabled: true
                        enabled: true
                        onClicked: { sendToParentQml({ method: "selectAvatar", params: { avatarUrl: "##AVATAR_URL##" } }); }
                    }
                }

                Component.onCompleted:{
                    sendToParentQml.connect(sendToScript);
                }
            }';
        var qmlStr = replaceAll(template, '##THUMBNAIL_URL##', thumbnailUrl);
        qmlStr = replaceAll(qmlStr, '##NAME##', name);
        qmlStr = replaceAll(qmlStr, '##AVATAR_URL##', avatarUrl);
        var newObject = Qt.createQmlObject(qmlStr, grid, "dynamicSnippet1");
    }

    function addTextEntry(str, hspan, methodNameWhenClicked) {
        var template = '
            import QtQuick.Layouts 1.3
            import QtQuick 2.5

            Text {
                signal sendToParentQml(var message);

                id: itemName
                text: "##STR##"
                color: "#1398BB"
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
                font.pointSize: 7
                wrapMode: Text.WordWrap
                width: parent
                Layout.columnSpan: ##H_SPAN##
                MouseArea {
                    id: itemNameArea
                    anchors.fill: parent
                    hoverEnabled: true
                    enabled: true
                    onClicked: { sendToParentQml({ method: "##METHOD_CLICK##", params: {  } }); }
                }

                Component.onCompleted:{
                    sendToParentQml.connect(sendToScript);
                }
            }
        ';

        var qmlStr = replaceAll(template, '##STR##', str);
        qmlStr = replaceAll(qmlStr, '##H_SPAN##', hspan);
        qmlStr = replaceAll(qmlStr, '##METHOD_CLICK##', methodNameWhenClicked);
        var newObject = Qt.createQmlObject(qmlStr, grid, "dynamicSnippet2");
    }

    function fromScript(message) {
        //console.log("[CHAT] fromScript " + JSON.stringify(message));
        switch (message.type) {
            case "addAvatar":
                addAvatar(message.name, message.thumbnailUrl, message.avatarUrl);
            break;
            case "addTextEntry":
                addTextEntry(message.str, message.hspan, message.methodNameWhenClicked);
            break;
            default:
        }
    }
}