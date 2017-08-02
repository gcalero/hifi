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
import ".."

ColumnLayout {
    objectName: "ColumnLayout"
    property var nearbyUserModelData: [];
    property int rowHeight: 60;
    property int nearbyNameCardWidth: nearbyTable.width
    HifiConstants { id: hifi; }

    z:100
    spacing: 1
    Settings {
        id: settings
        category: 'friends'
        property int nearDistance: 30
    }

    ListModel {
        id: connectionsModel
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
        id: friendshereLabel
        text: "Friends here"
        color: "green"
        font.family: "Helvetica"
        font.pointSize: 8
    }

        // This TableView refers to the Nearby Table (on the "Nearby" tab below the current user's NameCard)

    HifiControlsUit.Table {
        id: nearbyTable;
        flickableItem.interactive: true;
        // Anchors
        anchors.top: friendshereLabel.bottom;
        anchors.right: parent.right
        anchors.left: parent.left

        // Properties
        centerHeaderText: true;
        sortIndicatorVisible: false;
        headerVisible: false;
        // sortIndicatorColumn: settings.nearbySortIndicatorColumn;
        //  sortIndicatorOrder: settings.nearbySortIndicatorOrder;
        TableViewColumn {
            id: displayNameHeader;
            role: "displayName";
            title: nearbyTable.rowCount + (nearbyTable.rowCount === 1 ? " NAME" : " NAMES");
            width: nearbyNameCardWidth;
            movable: false;
            resizable: false;
        }
        model: ListModel {
            id: nearbyUserModel;
        }

        // This Rectangle refers to each Row in the nearbyTable.
        rowDelegate: Rectangle { // The only way I know to specify a row height.
            // Size
            height: rowHeight ;
            color: hifi.colors.tableRowLightEven // nearbyRowColor(styleData.selected, styleData.alternate);
        }

        // This Item refers to the contents of each Cell
        itemDelegate: Item {
            id: itemCell;
            // This NameCard refers to the cell that contains an avatar's
            // DisplayName and UserName
            // This NameCard refers to the cell that contains an avatar's
            // DisplayName and UserName
            SimpleNameCard {
                objectName: model.sessionId
                id: nameCard;
                // Properties
                profileUrl: model.profileUrl || "";
                displayName: model.displayName;
                userName: displayName
                connectionStatus: model ? model.connection : "";
                visible: true
                uuid: model ? model.sessionId : "";
                selected: true;
                //isReplicated: model.isReplicated;
                //isAdmin: model && model.admin;
                isPresent: model && model.isPresent;
                // Size
                width: parent.width;
                height: parent.height;
                // Anchors
                anchors.left: parent.left;
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

    function removeNearbyUserById(userId) {
        var i=0;
        //console.log("[FRIENDS] removeNearbyUserById search " + userId + " among " + nearbyUserModel.count);
        for(;i<nearbyUserModelData.length;i++) {
            //console.log("[FRIENDS] i: " + i + " comparing " + nearbyUserModelData[i] + " sessionId: " + nearbyUserModelData[i].sessionId);
            if (nearbyUserModelData[i].sessionId == userId) {
                //console.log("[FRIENDS] match at index " + i);
                nearbyUserModel.remove(i);
                return;
            }
        }
    }

    function loadConnection(f) {
        connectionsModel.append (f);
    }

    function loadNearbyUsers(data) {
        nearbyUserModelData = data;
        // nearbyUserModelData.sort(function (a, b) ...

        nearbyUserModel.clear();
        var userIndex = 0;
        nearbyUserModelData.forEach(function (datum) {
            function init(property) {
                if (datum[property] === undefined) {
                    // These properties must have values of type 'string'.
                    if (property === 'userName' || property === 'profileUrl' || property === 'placeName' || property === 'connection') {
                        datum[property] = "";
                    // All other properties must have values of type 'bool'.
                    } else {
                        datum[property] = false;
                    }
                }
            }
            ['userName', 'profileUrl', 'placeName', 'connection'].forEach(init);
            datum.userIndex = userIndex++;
            nearbyUserModel.append(datum);
            /*if (selectedIDs.indexOf(datum.sessionId) != -1) {
                 newSelectedIndexes.push(datum.userIndex);
            }*/
        });

        /*if (newSelectedIndexes.length > 0) {
            nearbyTable.selection.select(newSelectedIndexes);
            nearbyTable.positionViewAtRow(newSelectedIndexes[0], ListView.Beginning);
        }*/
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
        case "nearbyUsers":
            var data = message.params;
            console.log("[FRIENDS] message from script nearbyUsers " + data.length);
            loadNearbyUsers(data);
            break;
        /*case "addUser":
            var data = message.params;
            loadNearbyUser(data.user, 0);
            break;*/
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

