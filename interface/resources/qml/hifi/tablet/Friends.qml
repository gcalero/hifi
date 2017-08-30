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

            Text {
                    id: allTab
                    text: "ALL"
                    color: "#ffffff"
                    font.family: "Helvetica"
                    font.pointSize: 8
                    //font.underline: true
                    //font.bold: true
                    anchors.left: parent.left
                    width: parent.width * 0.45
                    height: parent.height
                    verticalAlignment: Text.AlignVCenter
                    horizontalAlignment: Text.AlignHCenter
            }
            Text {
                    id: nearbyTab
                    text: "NEARBY"
                    color: "#ffffff"
                    font.family: "Helvetica"
                    font.pointSize: 8
                    font.underline: true
                    font.bold: true
                    width: allTab.width
                    height: parent.height
                    anchors.left : allTab.right
                    verticalAlignment: Text.AlignVCenter
                    horizontalAlignment: Text.AlignHCenter
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
            id: allConnections
        }
    }

    function loadNearbyFriends() {
        //nearbyFriendModelData.sort(function (a, b) { ...        
        //connectionsTable.selection.clear();
        nearbyFriendModel.clear();
        var userIndex = 0;
        //var newSelectedIndexes = [];
        nearbyFriendModelData.forEach(function (datum) {
            datum.userIndex = userIndex++;
            nearbyFriendModel.append(datum);
            /*if (selectedIDs.indexOf(datum.sessionId) != -1) {
                 newSelectedIndexes.push(datum.userIndex);
            }*/
        });
        /*if (newSelectedIndexes.length > 0) {
            connectionsTable.selection.select(newSelectedIndexes);
            connectionsTable.positionViewAtRow(newSelectedIndexes[0], ListView.Beginning);
        }*/
    }

    function loadOnlineFriends() {
        //onlineFriendModelData.sort(function (a, b) { ...        
        //connectionsTable.selection.clear();
        onlineFriendModel.clear();
        var userIndex = 0;
        //var newSelectedIndexes = [];
        onlineFriendModelData.forEach(function (datum) {
            datum.userIndex = userIndex++;
            onlineFriendModel.append(datum);
            /*if (selectedIDs.indexOf(datum.sessionId) != -1) {
                 newSelectedIndexes.push(datum.userIndex);
            }*/
        });
        /*if (newSelectedIndexes.length > 0) {
            connectionsTable.selection.select(newSelectedIndexes);
            connectionsTable.positionViewAtRow(newSelectedIndexes[0], ListView.Beginning);
        }*/
    }

    function fromScript(message) {
        //console.log("[FRIENDS] message from script " + message.method);
        switch (message.method) {
        case "nearbyFriends":
            var data = message.params;
            //console.log('Got nearbyFriends data: ', JSON.stringify(data));
            allConnections.modelData = data;
            allConnections.loadConnections();
            break;
        case "onlineFriends":
           /* var data = message.params;
            //console.log('Got onlineFriends data: ', JSON.stringify(data));
            onlineFriendModelData = data;
            loadOnlineFriends();
            break;
        */
        default:
            console.log('[FRIENDS] Unrecognized message:', JSON.stringify(message));
        }
    }

    signal sendToScript(var message);

    function refreshClicked() {
        console.log("[FRIENDS] refresh clicked");
        sendToScript({method: 'refreshAll', params: {}});
    }

    Component.onCompleted: {
        // put on bottom
        y=0;
        x=Window.innerWidth / 3 - width;
        // TODO: reactivate 
        // sendToScript({method: 'refreshAll', params: {}});
    }

}

