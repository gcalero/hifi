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
import "../../styles-uit"
import "../../controls-uit" as HifiControlsUit
import "../../controls" as HifiControls

ColumnLayout {
    objectName: "ColumnLayout"
    property var nearbyUserModelData: [];

    HifiConstants { id: hifi; }

    z:100
    spacing: 1
    Settings {
        id: settings
        category: 'friends'
        property int nearDistance: 30
    }

    ListModel {
        id: nearbyModel
    }

    ListModel {
        id: connectionsModel
    }

    Component {
        id: userDelegate
        Row {
            spacing: 1
            objectName: sessionId
            Text { 
                text: displayName + "(" + distance + ")"
                font.family: "Helvetica"
                font.pointSize: 8
                color: "#0f10fb"
                MouseArea {
                    anchors.fill: parent
                    // onClicked: console.log("friend row clicked")
                }
            }

        }
    }

    Component {
        id: connectionDelegate
        Row {
            spacing: 1
            Text { 
                text: userName + "(" + connection + ")"
                font.family: "Helvetica"
                font.pointSize: 8
                color: "#0f10fb"
                MouseArea {
                    anchors.fill: parent
                    // onClicked: console.log("friend row clicked")
                }
            }

        }
    }

    // Refresh button
    Rectangle {
        id: reloadNearbyContainer
        anchors.right: parent.right;
        anchors.rightMargin: 15;
        height: 12
        width: height;
        HifiControlsUit.GlyphButton {
            id: reloadNearby;
            width: reloadNearby.height;
            glyph: hifi.glyphs.reload;
            onClicked: {
                refreshClicked();
            }
        }
    }



    Text {
        objectName: "friendshereLabel"
        text: "Friends here"
        color: "green"
        font.family: "Helvetica"
        font.pointSize: 8
    }
    ScrollView {
        objectName: "scrollview-1"
       ListView {
            id: friendsHereList
            height: 200
            model: nearbyModel
            delegate: userDelegate
            spacing: 1
            MouseArea {
                anchors.fill: parent
                //onClicked: sendToScript({method: 'loadFriends', params: {}})
            }
        }
    }

    Text {
        objectName: "connectionsLabel"
        text: "Connections online"
        color: "green"
        font.family: "Helvetica"
        font.pointSize: 8
    }
    ScrollView {
        objectName: "scrollview-2"
        id: connectionsOnline
        ListView {
            height: 200
            model: connectionsModel
            delegate: connectionDelegate
            spacing: 1
            MouseArea {
                anchors.fill: parent
                propagateComposedEvents: false
            }
        }

    }

    function loadNearbyUser(f, index) {
        if (typeof index !== 'undefined') {
            nearbyModel.insert(index, f);
            nearbyUserModelData.splice(index, 0, f);
        } else {
            nearbyModel.append (f);
            nearbyUserModelData.push(f);
        }
    }

    function removeNearbyUserById(userId) {
        var i=0;
        //console.log("[FRIENDS] removeNearbyUserById search " + userId + " among " + nearbyModel.count);
        for(;i<nearbyUserModelData.length;i++) {
            //console.log("[FRIENDS] i: " + i + " comparing " + nearbyUserModelData[i] + " sessionId: " + nearbyUserModelData[i].sessionId);
            if (nearbyUserModelData[i].sessionId == userId) {
                //console.log("[FRIENDS] match at index " + i);
                nearbyModel.remove(i);
                return;
            }
        }
    }

    function loadConnection(f) {
        connectionsModel.append (f);
    }

    function loadUsers(data) {
        nearbyModel.clear();
        nearbyUserModelData = [];

        if (data && data.nearby) {
            //console.log("[FRIENDS] some nearby users");
            data.nearby.forEach(function (user) {
                loadNearbyUser(user);
            });
        }
    }

    function loadConnections(data) {
        connectionsModel.clear();
        if (data && data.connections) {
            //console.log("[FRIENDS] QML has received connections to show ("+data.connections.length+")");
            data.connections.forEach(function (connection) {
                //console.log("[FRIENDS] a connection");
                loadConnection(connection);
            });        
        }
    }

    function fromScript(message) {
        //console.log("[FRIENDS] message from script " + message.method);
        switch (message.method) {
        case "users":
            var data = message.params;
            loadUsers(data);
            break;
        case "addUser":
            var data = message.params;
            loadNearbyUser(data.user, 0);
            break;
        case "removeUser":
            var data = message.params;
            removeNearbyUserById(data.userId);
            break;
        case "connections":
            var data = message.params;
            loadConnections(data);
            break;
        default:
            console.log('[FRIENDS] Unrecognized message:', JSON.stringify(message));
        }
    }

    signal sendToScript(var message);

    function refreshClicked() {
        sendToScript({method: 'refreshNearby', params: {}});
        sendToScript({method: 'refreshConnections', params: {}});
    }

    // called after onLoaded
    function init() {
        var i=0;
        var ancestor = parent;
        var firstAncestor, secondAncestor, thirdAncestor;
        while (ancestor) {
            thirdAncestor = secondAncestor;
            secondAncestor = firstAncestor;
            firstAncestor = ancestor;
            ancestor = ancestor.parent;
            i++;
        }
        // 1st: QQuickRootItem > 2nd: Android(desktop) > 3rd: WindowRoot("tabletRoot")
        thirdAncestor.x=secondAncestor.width - thirdAncestor.width;
        thirdAncestor.y=0;
        thirdAncestor.height = secondAncestor.height;
        sendToScript({method: 'refreshNearby', params: {}});
        sendToScript({method: 'refreshConnections', params: {}});
    }

}

