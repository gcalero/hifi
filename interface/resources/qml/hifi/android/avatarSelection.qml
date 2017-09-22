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

Item {

	id: top

    signal sendToScript(var message);

    property bool shown: true

    onShownChanged: {
        top.visible = shown;
    }
    
	x: 10
    y: 10

    width: parent ? parent.width - 40 : 0
	height: parent ? parent.height - 80 : 0

    Rectangle {
        default property alias data: grid.data
        implicitWidth: grid.implicitWidth + 40
        implicitHeight: grid.implicitHeight + 40
        color: "#E3F2FD"
        Layout.alignment: Qt.AlignVCenter | Qt.AlignHCenter
        anchors { horizontalCenter: parent.horizontalCenter; verticalCenter: parent.verticalCenter }
        GridLayout {
            id: grid
            columnSpacing: 30
            rowSpacing: 30
            columns: 3
            Layout.alignment: Qt.AlignVCenter | Qt.AlignHCenter
            anchors { horizontalCenter: parent.horizontalCenter; verticalCenter: parent.verticalCenter }
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

    function fromScript(message) {
        //console.log("[CHAT] fromScript " + JSON.stringify(message));
        switch (message.type) {
            case "addAvatar":
                addAvatar(message.name, message.thumbnailUrl, message.avatarUrl);
            break;
            default:
        }
    }
}