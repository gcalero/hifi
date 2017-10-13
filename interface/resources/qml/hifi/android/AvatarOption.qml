//
//  AvatarOption.qml
//  interface/resources/qml/hifi/android
//
//  Created by Cristian Duarte & Gabriel Calero on 12 Oct 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import QtQuick.Layouts 1.3
import QtQuick 2.5
import "../../controls-uit" as HifiControlsUit

ColumnLayout {
    id: itemRoot

    property string type: "";

    property string thumbnailUrl: "";
    property string avatarUrl: "";
    property string avatarName: "";
    property bool avatarSelected: false;

    property string methodName: "";
    property string actionText: "";

    spacing: 4
    signal sendToParentQml(var message);

    Image {
        id: itemImage
        Layout.preferredWidth: 250
        Layout.preferredHeight: 140
        source: thumbnailUrl
        asynchronous: true
        fillMode: Image.PreserveAspectFit

        MouseArea {
            id: itemArea
            anchors.fill: parent
            hoverEnabled: true
            enabled: true
            onClicked: {
                if (type=="avatar") {
                    if (!avatarSelected) sendToParentQml({ method: "selectAvatar", params: { avatarUrl: avatarUrl } }); 
                } else {
                    sendToParentQml({ method: methodName, params: {  } });
                }
            }
        }

    }

    Text {
        id: itemName
        text: avatarName
        color: "#FFFFFF"
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        anchors.horizontalCenter: itemImage.horizontalCenter
        font.pointSize: 5
        wrapMode: Text.WordWrap
        width: parent
        MouseArea {
            id: itemNameArea
            anchors.fill: parent
            hoverEnabled: true
            enabled: true
            onClicked: {
                if (type=="avatar") {
                    if (!avatarSelected) sendToParentQml({ method: "selectAvatar", params: { avatarUrl: avatarUrl } }); 
                } else {
                    sendToParentQml({ method: methodName, params: {  } });
                }
            }
        }
    }

    HifiControlsUit.ImageButton {
        width: 140
        height: 35
        text: type=="extra"? actionText: "CHOOSE"
        source: "../../../images/button.svg"
        hoverSource: "../../../images/button-a.svg"
        fontSize: 18
        fontColor: "#2CD8FF"
        hoverFontColor: "#FFFFFF"
        anchors {
            horizontalCenter: itemName.horizontalCenter
        }
        visible: !avatarSelected
        onClicked: {
            if (type=="avatar") {
                if (!avatarSelected) sendToParentQml({ method: "selectAvatar", params: { avatarUrl: avatarUrl } }); 
            } else {
                sendToParentQml({ method: methodName, params: {  } });
            }
        }
    }

    Image {
        id: tickImage
        width: 35
        height: 35
        source: "../../../images/tick.svg"
        anchors {
            horizontalCenter: itemName.horizontalCenter
        }
        visible: avatarSelected
    }

    Component.onCompleted:{
        sendToParentQml.connect(sendToScript);
    }
}