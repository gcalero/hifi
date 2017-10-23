//
//  ConnectionsWindow.qml
//  interface/resources/qml/tablet
//
//  Created by Gabriel Calero & Cristian Duarte on 24 Jul 2017
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
import "../android"
import ".."

Rectangle {
    id: connections

    HifiAndroidConstants { id: android }

    width: parent ? parent.width - android.dimen.windowLessWidth : 0
    height: parent ? parent.height - android.dimen.windowLessHeight : 0
    z: android.dimen.windowZ
    anchors { horizontalCenter: parent.horizontalCenter; bottom: parent.bottom }

    property bool shown: true

    property var nearbyUserModelData: []; // This simple list is essentially a mirror of the nearbyUserModel listModel without all the extra complexities.

    onShownChanged: {
        connections.visible = shown;
    }

    /*HifiStylesUit.*/HifiConstants { id: hifi }

    HifiStyles.HifiConstants { id: hifiStylesConstants }

    function hide() {
        //shown = false;
        sendToScript ({ method: "hide" });
    }

    Settings {
        id: settings
        category: 'connections'
        property int nearDistance: 30
    }

    gradient: Gradient {
        GradientStop { position: 0.0; color: android.color.gradientTop }
        GradientStop { position: 1.0; color: android.color.gradientBottom }
    }

    WindowHeader {
        id: header
        iconSource: "../../../icons/android/people-i.svg"
        titleText: "PEOPLE"
        extraItemInCenter: Rectangle {
            id: tabs
            color: "#00000000"
            //color: "#550022aa"
            width: 342
            height: 40
            anchors.right: parent.right
            anchors.rightMargin: 76.7
            anchors.verticalCenter: parent.verticalCenter

            Item {
                id: nearbyTabItem
                implicitWidth: nearbyTabText.width
                height: parent.height
                anchors.left: parent.left
                anchors.verticalCenter: parent.verticalCenter

                FiraSansRegular {
                        id: nearbyTabText
                        text: "NEARBY"
                        color: "#2CD8FF"
                        font.pixelSize: hifiStylesConstants.fonts.headerPixelSize * 0.6
                        font.letterSpacing: 1
                        anchors.verticalCenter: parent.verticalCenter
                        verticalAlignment: Text.AlignVCenter
                        horizontalAlignment: Text.AlignLeft
                }

                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    enabled: true
                    onClicked: {
                        showNearbyConnections();
                    }
                }

                states: [
                    State {
                        name: "active"
                        PropertyChanges {
                            target: nearbyTabText
                            font.underline: true
                            color: "#FFFFFF"
                        }
                    }, 
                    State {
                        name: "inactive"
                        PropertyChanges {
                            target: nearbyTabText
                            font.underline: false
                            color: "#2CD8FF"
                        }
                    }
                ]

            }

            Item {
                id: allTabItem
                property bool isActive: false
                implicitWidth: allTabText.width
                height: parent.height
                anchors.right: parent.right
                anchors.verticalCenter: parent.verticalCenter

                FiraSansRegular {
                        id: allTabText
                        text: "MY CONNECTIONS"
                        color: "#2CD8FF"
                        font.pixelSize: hifiStylesConstants.fonts.headerPixelSize * 0.6
                        font.letterSpacing: 1
                        anchors.verticalCenter: parent.verticalCenter
                        verticalAlignment: Text.AlignVCenter
                        horizontalAlignment: Text.AlignHCenter
                }

                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    enabled: true
                    onClicked: {
                        showAllConnections();
                    }
                }

                states: [
                    State {
                        name: "active"
                        PropertyChanges {
                            target: allTabText
                            font.underline: true
                            color: "#FFFFFF"
                        }
                    }, 
                    State {
                        name: "inactive"
                        PropertyChanges {
                            target: allTabText
                            font.underline: false
                            color: "#2CD8FF"
                        }
                    }
                ]
            }
        }
    }

/*
    HifiControlsUit.GlyphButton {
        id: reloadNearby;
        //anchors.right: parent.right;
        //anchors.rightMargin: 5
        width: reloadNearby.height;
        glyph: hifi.glyphs.reload;
        //anchors.verticalCenter: parent.verticalCenter
        anchors.top: parent.top
        anchors.horizontalCenter: parent.horizontalCenter
        onClicked: {
            refreshClicked();
        }
    }
*/
    // content
    Rectangle {
        id: content
        //width: parent.width
        anchors.top : header.bottom
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.topMargin: 27
        anchors.leftMargin: 42
        anchors.rightMargin: 42
        //color: "#44005566"
        color: "#00000000"
        //anchors.topMargin: 10
        Connections {
            id: nearbyConnections
        }
        Connections {
            id: allConnections
        }
    }

    function fromScript(message) {
        //console.log("[CONNECTIONS] message from script " + message.method);
        switch (message.method) {
        case "allConnections":
            var data = message.params;
            allConnections.modelData = data;
            allConnections.loadConnections();
            break;
        case "nearbyUsers":
            var data = message.params;
            nearbyUserModelData = data;
            //console.log("[NEARBY] load " + data.length);
            nearbyConnections.modelData = data;
            nearbyConnections.loadConnections();
            break;
        case "updateUsername":
            var userIndex = findNearbySessionIndex(message.params.sessionId);
            // console.log("[NEARBY] update username " + message.params.userName + "(" + 
            //                                          message.params.sessionId + ") index " + 
            //                                          userIndex);
            
            if (userIndex !== -1) {
                ['userName', 'connection', 'profileUrl', 'placeName'].forEach(function (name) {
                    var value = message.params[name];
                    // console.log("[NEARBY] upd [" + name + "]="+value);
                    if (value === undefined) {
                        // console.log("[NEARBY] value is undefined " + name);
                        return;
                    }
                    nearbyConnections.updateProperty(userIndex, name, value);
                    nearbyUserModelData[userIndex][name] = value;
                });

            }
            break;
        default:
            console.log('[CONNECTIONS] Unrecognized message:', JSON.stringify(message));
        }
    }

    signal sendToScript(var message);

    function findNearbySessionIndex(sessionId) {
        var data = nearbyUserModelData, length = data.length;
        for (var i = 0; i < length; i++) {
            // console.log("[NEARBY] " + data[i].sessionId + " ? " + sessionId ); 
            if (data[i].sessionId === sessionId) {
                return i;
            }
        }
        return -1;
    }

/*
    function refreshClicked() {
        console.log("[CONNECTIONS] refresh clicked");
        sendToScript({method: 'refreshAll', params: {}});
    }
*/
    function showAllConnections() {
        allConnections.visible = true;
        nearbyConnections.visible = false;
        nearbyTabItem.state = "inactive";
        allTabItem.state = "active";
    }

    function showNearbyConnections() {
        console.log("[CONNECTIONS] nearby load connections");
        allConnections.visible = false;
        nearbyConnections.visible = true;
        nearbyTabItem.state = "active";
        allTabItem.state = "inactive";
    }

    Component.onCompleted: {
        // put on bottom
        y=0;
        x=Window.innerWidth / 3 - width;
        showAllConnections();
        sendToScript({method: 'refreshAll', params: {}});
    }

}

