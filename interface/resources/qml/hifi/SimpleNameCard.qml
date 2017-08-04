//
//  SimpleNameCard.qml
//  qml/hifi
//
//  Created by Gabriel Calero & Cristian Duarte on 08/02/2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtGraphicalEffects 1.0
import "../styles-uit"
import "../controls-uit" as HifiControls
import "toolbars"

// references Users, UserActivityLogger, MyAvatar, Vec3, Quat, AddressManager from root context

Item {
    id: thisNameCard
    // Size
    width: 200
    height: 60
    anchors.left: parent.left
    anchors.leftMargin: 5
    anchors.top: parent.top

    // Properties
    property string profileUrl: "";
    property string defaultBaseUrl: "https://metaverse.highfidelity.com"; // AddressManager.metaverseServerUrl;
    property string connectionStatus : ""
    property string uuid: ""
    property string displayName: ""
    property string userName: ""
    property real displayNameTextPixelSize: 18
    property int usernameTextPixelSize: 14
/*    property real audioLevel: 0.0
    property real avgAudioLevel: 0.0
    property bool isMyCard: false*/
    property bool selected: false
    property bool isAdmin: false
    property bool isPresent: true
//    property bool isReplicated: false
    property string placeName: ""
    property string profilePicBorderColor: (connectionStatus == "connection" ? hifi.colors.indigoAccent : (connectionStatus == "friend" ? hifi.colors.greenHighlight : "transparent"))
    property alias avImage: avatarImage
    Item {
        id: avatarImage
        visible: profileUrl !== "" && userName !== "";
        // Size
        height: 42
        width: visible ? height : 0;
        anchors.top: parent.top
        anchors.topMargin: 8
        anchors.left: parent.left
        clip: true
        Image {
            id: userImage
            source: profileUrl !== "" ? ((0 === profileUrl.indexOf("http")) ? profileUrl : (defaultBaseUrl + profileUrl)) : "";
            mipmap: true;
            // Anchors
            anchors.fill: parent
            layer.enabled: true
            layer.effect: OpacityMask {
                maskSource: Item {
                    width: userImage.width;
                    height: userImage.height;
                    Rectangle {
                        anchors.centerIn: parent;
                        width: userImage.width; // This works because userImage is square
                        height: width;
                        radius: width;
                    }
                }
            }
        }
        AnimatedImage {
            source: "../../icons/profilePicLoading.gif"
            anchors.fill: parent;
            visible: userImage.status != Image.Ready;
        }
        StateImage {
            id: infoHoverImage;
            visible: false;
            imageURL: "../../images/info-icon-2-state.svg";
            size: 32;
            buttonState: 1;
            anchors.centerIn: parent;
        }
        MouseArea {
            anchors.fill: parent
            enabled: true
            hoverEnabled: enabled
            onClicked: {
                userInfoViewer.url = defaultBaseUrl + "/users/" + userName;
                userInfoViewer.visible = true;
            }
            onEntered: infoHoverImage.visible = true;
            onExited: infoHoverImage.visible = false;
        }
    }

    // Colored border around avatarImage
    Rectangle {
        id: avatarImageBorder;
        visible: avatarImage.visible;
        anchors.verticalCenter: avatarImage.verticalCenter;
        anchors.horizontalCenter: avatarImage.horizontalCenter;
        width: avatarImage.width + border.width;
        height: avatarImage.height + border.width;
        color: "transparent"
        radius: avatarImage.height;
        border.color: profilePicBorderColor;
        border.width: 4;
    }

    // DisplayName container for others' cards
    Item {
        id: displayNameContainer
        visible: true
        // Size
        width: parent.width - anchors.leftMargin - avatarImage.width - anchors.leftMargin;
        height: displayNameTextPixelSize + 4
        // Anchors
        anchors.top: avatarImage.top;
        anchors.left: avatarImage.right
        anchors.leftMargin: avatarImage.visible ? 5 : 0;
        // DisplayName Text for others' cards
        FiraSansSemiBold {
            id: displayNameText
            visible: true
            // Properties
            text: thisNameCard.displayName
            elide: Text.ElideRight
            // Size
            width: parent.width
            // Anchors
            anchors.top: parent.top
            anchors.left: parent.left
            // Text Size
            size: displayNameTextPixelSize
            // Text Positioning
            verticalAlignment: Text.AlignTop
            // Style
            color: hifi.colors.darkGray;
            MouseArea {
                anchors.fill: parent
                enabled: isPresent;
                hoverEnabled: enabled
                onClicked: {
                    goToUserInDomain(thisNameCard.uuid);
                    // UserActivityLogger.palAction("go_to_user_in_domain", thisNameCard.uuid);
                    // AddressManager.goToUser(thisNameCard.userName);
                    // UserActivityLogger.palAction("go_to_user", thisNameCard.userName);
                }
                onEntered: {
                    displayNameText.color = hifi.colors.blueHighlight;
                    userNameText.color = hifi.colors.blueHighlight;
                }
                onExited: {
                    displayNameText.color = hifi.colors.darkGray
                    userNameText.color = hifi.colors.blueAccent;
                }
            }
        }
        TextMetrics {
            id:     displayNameTextMetrics
            font:   displayNameText.font
            text:   displayNameText.text
        }
    }

    // UserName Text
    FiraSansRegular {
        id: userNameText
        // Properties
        text: thisNameCard.userName === "Unknown user" ? "not logged in" : thisNameCard.userName;
        elide: Text.ElideRight
        visible: true
        // Size
        width: parent.width
        height: usernameTextPixelSize + 4
        // Anchors
        anchors.top: displayNameContainer.bottom
        anchors.left: displayNameContainer.left;
        /*anchors.verticalCenter: avatarImage.verticalCenter
        
        anchors.leftMargin: avatarImage.visible ? 5 : 0;
        anchors.rightMargin: 5;
        */

        // Text Size
        size: displayNameTextPixelSize
        // Text Positioning
        verticalAlignment: Text.AlignVCenter;
        // Style
        color: hifi.colors.blueAccent;
        /*MouseArea {
            anchors.fill: parent
            enabled: thisNameCard.userName !== "" && isPresent;
            hoverEnabled: enabled
            onClicked: {
                goToUserInDomain(thisNameCard.uuid);
                //UserActivityLogger.palAction("go_to_user_in_domain", thisNameCard.uuid);
            }
            onEntered: {
                displayNameText.color = hifi.colors.blueHighlight;
                userNameText.color = hifi.colors.blueHighlight;
            }
            onExited: {
                displayNameText.color = hifi.colors.darkGray;
                userNameText.color = hifi.colors.blueAccent;
            }
        }*/
    }

    // Function body by Howard Stearns 2017-01-08
    function goToUserInDomain(avatarUuid) {
        var avatar = AvatarList.getAvatar(avatarUuid);
        if (!avatar) {
            console.log("This avatar is no longer present. goToUserInDomain() failed.");
            return;
        }
        // FIXME: We would like the avatar to recompute the avatar's "maybe fly" test at the new position, so that if high enough up,
        // the avatar goes into fly mode rather than falling. However, that is not exposed to Javascript right now.
        // FIXME: it would be nice if this used the same teleport steps and smoothing as in the teleport.js script.
        // Note, however, that this script allows teleporting to a person in the air, while teleport.js is going to a grounded target.
        MyAvatar.position = Vec3.sum(avatar.position, Vec3.multiplyQbyV(avatar.orientation, {x: 0, y: 0, z: -2}));
        MyAvatar.orientation = Quat.multiply(avatar.orientation, {y: 1});
    }
}
