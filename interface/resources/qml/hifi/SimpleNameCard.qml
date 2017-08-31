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
    width: parent.width
    height: 60

    // Properties
    property string profileUrl: "";
    property string defaultBaseUrl: "https://metaverse.highfidelity.com"; // AddressManager.metaverseServerUrl;
    property string connectionStatus : ""
    property string uuid: ""
    property string displayName: ""
    property string userName: ""
    property real displayNameTextPixelSize: 25
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
        height: parent.height
        width: visible ? height : 0;
        anchors.left: parent.left
        anchors.leftMargin: 150
        anchors.verticalCenter: parent.verticalCenter
        clip: true
        Image {
            height: 42
            width: 42
            id: userImage
            source: profileUrl !== "" ? ((0 === profileUrl.indexOf("http")) ? profileUrl : (defaultBaseUrl + profileUrl)) : "";
            mipmap: true;
            // Anchors
            anchors.verticalCenter: avatarImage.verticalCenter;
            anchors.horizontalCenter: avatarImage.horizontalCenter;

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
                locate(thisNameCard.userName);
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
        width: 46;
        height: 46;
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
        width: parent.width / 3;// - anchors.leftMargin - avatarImage.width - anchors.leftMargin;
        height: displayNameTextPixelSize + 4
        // Anchors
        anchors.left: avatarImage.right
        anchors.leftMargin: avatarImage.visible ? 5 : 0;
        anchors.verticalCenter: avatarImage.verticalCenter;
        // DisplayName Text for others' cards
        FiraSansRegular {
            id: displayNameText
            visible: true
            // Properties
            text: thisNameCard.userName === "Unknown user" ? "not logged in" : thisNameCard.userName; //thisNameCard.displayName
            //elide: Text.ElideRight
            // Size
            width: parent.width
            height: parent.height
            // Anchors
            //anchors.top: parent.top
            anchors.left: parent.left
            anchors.verticalCenter: parent.verticalCenter
            // Text Size
            size: displayNameTextPixelSize
            // Text Positioning
            verticalAlignment: Text.AlignVCenter
            // Style
            color: "#FFFFFF"
        }
        TextMetrics {
            id:     displayNameTextMetrics
            font:   displayNameText.font
            text:   displayNameText.text
        }
    }

    Rectangle {
        id: buttonsContainer
        color: "#A0A0A0"
        width: parent.width * 0.25
        height: parent.height
        anchors.right: parent.right
        Row {
            spacing: 20
            anchors.fill: parent
            anchors.margins: 2
            anchors.verticalCenter: parent.verticalCenter
            Item {
                id: chatButton
                height: parent.height
                width: height
                Image {
                    id: chatIcon;
                    source: "../../icons/android/chat-i.svg";
                    height: parent.height * 0.7
                    width: parent.width * 0.7
                    anchors.verticalCenter: parent.verticalCenter;
                }
                MouseArea {
                        anchors.fill: chatIcon
                        hoverEnabled: true
                        enabled: true
                        onClicked: {
                            console.log("[FRIEND] CHAT CLICKED");
                        }
                        onEntered: {
                            chatButton.state = "hover";
                        }
                        onExited: {
                            chatButton.state = "base";
                        }
                        onCanceled: {
                            chatButton.state = "base";
                        }
                }
                states: [
                    State {
                        name: "hover"
                        PropertyChanges {
                            target: chatIcon
                            source: "../../icons/android/chat-a.svg"
                        }
                    },
                    State {
                        name: "base"
                        PropertyChanges {
                            target: chatIcon
                            source: "../../icons/android/chat-i.svg"
                        }
                    }
                ]
            }

            Item {
                id: goButton
                height: parent.height
                width: height
                Image {
                    id: goIcon;
                    source: "../../icons/android/go-i.svg"
                    height: parent.height * 0.7
                    width: parent.width * 0.7
                    anchors.verticalCenter: parent.verticalCenter;
                }
                MouseArea {
                        anchors.fill: goIcon
                        hoverEnabled: true
                        enabled: true
                        onClicked: {
                            AddressManager.goToUser(thisNameCard.userName);
                            // TODO: hide this window?
                        }
                        onEntered: {
                            goButton.state = "hover";
                        }
                        onExited: {
                            goButton.state = "base";
                        }
                        onCanceled: {
                            goButton.state = "base";
                        }
                }
                states: [
                    State {
                        name: "hover"
                        PropertyChanges {
                            target: goIcon
                            source: "../../icons/android/go-a.svg"
                        }
                    },
                    State {
                        name: "base"
                        PropertyChanges {
                            target: goIcon
                            source: "../../icons/android/go-i.svg"
                        }
                    }
                ]
            }
        }
    }

    function locate(username) {
        sendToScript({method: 'locateFriend', params: { username: username }});
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
