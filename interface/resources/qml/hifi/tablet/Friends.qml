//
//  Friends.qml
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
import "../../styles-uit"
import "../../controls-uit" as HifiControlsUit
import "../../controls" as HifiControls
import ".."

Rectangle {
    id: connections

    //size
    width: Window.innerWidth * 0.3;
    height: Window.innerHeight / 3;

    property var onlineFriendModelData: []; // This simple list is essentially a mirror of the onlineFriendModel listModel without all the extra 
    property int rowHeight: 60;
    property int locationColumnWidth: 170;
    //property int nearbyNameCardWidth: nearbyTable.width
    //property int connectionsNameCardWidth: connectionsTable.width;

    HifiConstants { id: hifi; }

    z:100

    Settings {
        id: settings
        category: 'friends'
        property int nearDistance: 30
    }

    // header
    Rectangle {
        id: header
        color: "#A0A0A0"
        width: parent.width
        height: parent.height * 0.2
        anchors.top : parent.top
        
        Image {
            id: connectionsImage;
            source: "../../../icons/android/people-i.svg"
            height: parent.height * 0.8
            width: height
            mipmap: true
            // Anchors
            x: 50
            anchors.topMargin: parent.height * 0.1
            anchors.verticalCenter: parent.verticalCenter
        }

        Text {
            text: "Connections:"
            color: "#ffffff"
            font.family: "Helvetica"
            font.pointSize: 8
            anchors.leftMargin: 30
            anchors.left: connectionsImage.right
            anchors.verticalCenter: parent.verticalCenter
        }

        Rectangle {
            id: tabs
            color: "#A0A0A0"
            width: parent.width * 0.55
            height: parent.height
            anchors.right: parent.right
            y: 0

            Item {
                id: allTabItem
                property bool isActive: false

                width: parent.width * 0.45
                height: parent.height

                Text {
                        id: allTabText
                        text: "ALL"
                        color: "#ffffff"
                        font.family: "Helvetica"
                        font.pointSize: 6
                        anchors.fill: parent
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
                            font.bold: true
                        }
                    }, 
                    State {
                        name: "inactive"
                        PropertyChanges {
                            target: allTab
                            font.underline: false
                            font.bold: false
                        }
                    }
                ]
            }


            Item {
                id: nearbyTabItem

                width: parent.width * 0.45
                height: parent.height
                anchors.right: parent.right

                Text {
                        id: nearbyTabText
                        text: "NEARBY"
                        color: "#ffffff"
                        font.family: "Helvetica"
                        font.pointSize: 6
                        anchors.fill: parent
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
                            font.bold: true
                        }
                    }, 
                    State {
                        name: "inactive"
                        PropertyChanges {
                            target: nearbyTabText
                            font.underline: false
                            font.bold: false
                        }
                    }
                ]

            }

            HifiControlsUit.GlyphButton {
                id: reloadNearby;
                anchors.right: parent.right;
                anchors.rightMargin: 5
                width: reloadNearby.height;
                glyph: hifi.glyphs.reload;
                anchors.verticalCenter: parent.verticalCenter
                onClicked: {
                    refreshClicked();
                }
            }

        }

    }

    // content
    Rectangle {
        id: content
        width: parent.width
        anchors.top : header.bottom
        anchors.bottom: parent.bottom
        //anchors.topMargin: 10
        Connections {
            id: nearbyConnections
        }
        Connections {
            id: allConnections
        }
    }

    function fromScript(message) {
        console.log("[FRIENDS] message from script " + message.method);
        switch (message.method) {
        case "allConnections":
            var data = message.params;
            allConnections.modelData = data;
            allConnections.loadConnections();
            break;
        case "nearbyConnections":
            var data = message.params;
            nearbyConnections.modelData = data;
            nearbyConnections.loadConnections();
            break;
        
        default:
            console.log('[FRIENDS] Unrecognized message:', JSON.stringify(message));
        }
    }

    signal sendToScript(var message);

    function refreshClicked() {
        console.log("[FRIENDS] refresh clicked");
        sendToScript({method: 'refreshAll', params: {}});
    }

    function showAllConnections() {
        allConnections.visible = true;
        nearbyConnections.visible = false;
        nearbyTabItem.state = "inactive";
        allTabItem.state = "active";
    }

    function showNearbyConnections() {
        console.log("[FRIENDS] nearby load connections");
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

