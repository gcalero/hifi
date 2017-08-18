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
    property var nearbyFriendModelData: []; // This simple list is essentially a mirror of the nearbyFrienModel listModel without all the extra complexities.
    property var onlineFriendModelData: []; // This simple list is essentially a mirror of the onlineFriendModel listModel without all the extra 
    property int rowHeight: 60;
    property int locationColumnWidth: 170;
    property int nearbyNameCardWidth: nearbyTable.width
    property int connectionsNameCardWidth: connectionsTable.width;

    HifiConstants { id: hifi; }

    z:100
    spacing: 1
    Layout.minimumWidth: 400
    Layout.fillWidth: true
    Settings {
        id: settings
        category: 'friends'
        property int nearDistance: 30
    }
    // Refresh button
    Rectangle {
        color: "#000000"
        id: reloadNearbyContainer
        //anchors.right: parent.right;
        //anchors.left: parent.left
        anchors.rightMargin: 5;
        height: 40
        width: 250;
        Text {
            id: friendshereLabel
            text: "Friends here"
            color: "#aeaeae"
            font.family: "Helvetica"
            font.pointSize: 6
            width: 400;
        }
        HifiControlsUit.GlyphButton {
            anchors.right: parent.right;
            anchors.rightMargin: 15
            id: reloadNearby;
            width: reloadNearby.height;
            glyph: hifi.glyphs.reload;
            onClicked: {
                refreshClicked();
            }
        }
    }

    Rectangle {
        color: "#000000"
        anchors.top: reloadNearbyContainer.bottom
        anchors.right: parent.right
        anchors.left: parent.left
        height: 200
        width: 400;
        // This TableView refers to the Nearby Table (on the "Nearby" tab below the current user's NameCard)
        HifiControlsUit.Table {
            id: nearbyTable;
            flickableItem.interactive: true;
            height: 900
            width: 400;
            // Anchors
            anchors.fill: parent
            // Properties
            sortIndicatorVisible: false;
            headerVisible: false;

            TableViewColumn {
                id: displayNameHeader;
                role: "displayName";
                title: nearbyTable.rowCount + (nearbyTable.rowCount === 1 ? " NAME" : " NAMES");
                width: nearbyNameCardWidth;
                movable: false;
                resizable: false;
            }
            model: ListModel {
                id: nearbyFriendModel;
            }

            // This Rectangle refers to each Row in the nearbyTable.
            rowDelegate: Rectangle { // The only way I know to specify a row height.
                // Size
                height: rowHeight ;
                color: hifi.colors.tableRowLightEven
            }

            // This Item refers to the contents of each Cell
            itemDelegate: Item {
                id: itemCell;
                // This NameCard refers to the cell that contains an avatar's
                // DisplayName and UserName
                SimpleNameCard {
                    objectName: (model && model.sessionId) || "";
                    id: nearByNameCard;
                    uuid: (model && model.sessionId) || "";
                    // Properties
                    visible: true
                    profileUrl: (model && model.profileUrl) || "";
                    displayName: "";
                    userName: model ? model.userName : "";
                    placeName: "Placename here"; // model ? model.placeName : ""
                    connectionStatus : model ? model.connection : "";
                    selected: styleData.selected;
                    // Size
                    width: connectionsNameCardWidth;
                    height: parent.height;
                    // Anchors
                    anchors.left: parent.left;
                }

            }
        }
    }


    Text {
        id: "connectionsLabel"
        text: "Friends online"
        color: "#aeaeae"
        font.family: "Helvetica"
        font.pointSize: 6
        width: 400;
    }

    Rectangle {
        color: "#000000"
        anchors.right: parent.right
        anchors.left: parent.left
        height: 200
        width: 400;
            // This TableView refers to the Connections Table (on the "Connections" tab below the current user's NameCard)
    HifiControlsUit.Table {
        id: connectionsTable;
        flickableItem.interactive: true;
        width: 400;
        // Anchors
        anchors.fill : parent
        // Properties
        sortIndicatorVisible: false;
        headerVisible: false;

        TableViewColumn {
            id: onlineFriendNameHeader;
            role: "userName";
            title: connectionsTable.rowCount + (connectionsTable.rowCount === 1 ? " NAME" : " NAMES");
            width: connectionsNameCardWidth;
            movable: false;
            resizable: false;
        }
        TableViewColumn {
            role: "placeName";
            title: "LOCATION";
            width: locationColumnWidth;
            movable: false;
            resizable: false;
        }
        TableViewColumn {
            role: "connection";
            title: "FRIEND";
            //width: actionButtonWidth;
            movable: false;
            resizable: false;
        }

        model: ListModel {
            id: onlineFriendModel;
        }

        // This Rectangle refers to each Row in the connectionsTable.
        rowDelegate: Rectangle {
            // Size
            height: rowHeight + (styleData.selected ? 15 : 0);
            color: hifi.colors.tableRowLightEven
        }

        // This Item refers to the contents of each Cell
        itemDelegate: Item {
            id: connectionsItemCell;

            // This NameCard refers to the cell that contains a connection's UserName
            SimpleNameCard {
                objectName: (model && model.sessionId) || "";
                id: connectionsNameCard;
                uuid: (model && model.sessionId) || "";
                // Properties
                visible: true
                profileUrl: (model && model.profileUrl) || "";
                displayName: "";
                userName: model ? model.userName : "";
                placeName: "Placename here"; // model ? model.placeName : ""
                connectionStatus : model ? model.connection : "";
                selected: styleData.selected;
                // Size
                width: connectionsNameCardWidth;
                height: parent.height;
                // Anchors
                anchors.left: parent.left;
            }

            // LOCATION data
            FiraSansRegular {
                id: connectionsLocationData
                // Properties
                visible: styleData.role === "placeName";
                text: (model && model.placeName) || "";
                elide: Text.ElideRight;
                // Size
                width: parent.width;
                // you would think that this would work:
                // anchors.verticalCenter: connectionsNameCard.avImage.verticalCenter
                // but no!  you cannot anchor to a non-sibling or parent.  So I will
                // align with the friends checkbox, where I did the manual alignment
                //anchors.verticalCenter: friendsCheckBox.verticalCenter
                // Text Size
                size: 16;
                // Text Positioning
                verticalAlignment: Text.AlignVCenter
                horizontalAlignment: Text.AlignHCenter
                // Style
                color: hifi.colors.blueAccent;
                font.underline: true;
                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: enabled
                    enabled: true // connectionsNameCard.selected && pal.activeTab == "connectionsTab"
                    onClicked: {
                        AddressManager.goToUser(model.userName);
                        UserActivityLogger.palAction("go_to_user", model.userName);
                    }
                    onEntered: connectionsLocationData.color = hifi.colors.blueHighlight;
                    onExited: connectionsLocationData.color = hifi.colors.blueAccent;
                }
            }

            // "Friends" checkbox
            /*HifiControlsUit.CheckBox {
                id: friendsCheckBox;
                visible: true
                // you would think that this would work:
                // anchors.verticalCenter: connectionsNameCard.avImage.verticalCenter
                // but no!  you cannot anchor to a non-sibling or parent.  So:
                x: parent.width/2 - boxSize/2;
                y: connectionsNameCard.avImage.y + connectionsNameCard.avImage.height/2 - boxSize/2;
                checked: model && (model.connection === "friend");
                boxSize: 24;
                enabled: false
                onClicked: {
                    var newValue = model.connection !== "friend";
                    onlineFriendModel.setProperty(model.userIndex, styleData.role, (newValue ? "friend" : "connection"));
                    onlineFriendModelData[model.userIndex][styleData.role] = newValue; // Defensive programming
                    //pal.sendToScript({method: newValue ? 'addFriend' : 'removeFriend', params: model.userName});

                    UserActivityLogger["palAction"](newValue ? styleData.role : "un-" + styleData.role, model.sessionId);
                }
            }*/
        }
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
            nearbyFriendModelData = data;
            loadNearbyFriends();
            break;
        case "onlineFriends":
            var data = message.params;
            //console.log('Got onlineFriends data: ', JSON.stringify(data));
            onlineFriendModelData = data;
            loadOnlineFriends();
            break;

        default:
            console.log('[FRIENDS] Unrecognized message:', JSON.stringify(message));
        }
    }

    signal sendToScript(var message);

    function refreshClicked() {
        sendToScript({method: 'refreshAll', params: {}});
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
        //thirdAncestor.width=400;
        thirdAncestor.x=secondAncestor.width - thirdAncestor.width;
        thirdAncestor.y=0;
        thirdAncestor.height = secondAncestor.height;
        sendToScript({method: 'refreshAll', params: {}});
    }

}

