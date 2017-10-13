//
//  Chat.qml
//  interface/resources/qml/android
//
//  Created by Gabriel Calero & Cristian Duarte on 15 Sep 2017
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
import "../../styles"
import "../../styles-uit" as HifiStyles
import "../../controls-uit" as HifiControlsUit
import "../../controls" as HifiControls
import ".."

Item {
	id: top

    property bool shown: true

    property bool typing: false

    signal sendToScript(var message);

	onShownChanged: {
        top.visible = shown;
    }

    function hide() {
        shown = false;
    }

    x: 10
    y: 10

	width: parent ? parent.width - 20 : 0
	height: parent ? parent.height - 40 : 0

    HifiConstants { id: hifi }
    HifiStyles.HifiConstants { id: hifiStyleConstants }

	ListModel {
        id: chatContent
        ListElement {
            transmitter: ""
            content: "Type /? or /help for help with chat."
            textColor: "#00FF00"
        }
    }

    Rectangle {
        id: background
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#4E4E4E"  } // 
            GradientStop { position: 1.0; color: "#242424" } // "#242424"
        }
        anchors {
            fill: parent
            topMargin: 15
            leftMargin: 35
            rightMargin: 35
            bottomMargin: 5
        }

        Image {
            id: chatIcon
            source: "../../../icons/android/chat-i.svg"
            x: 45
            y: 45
            width: 55
            height: 55
        }

        HifiStyles.FiraSansRegular {
            x: 120
            anchors.verticalCenter: chatIcon.verticalCenter
            text: "CHAT"
            color: "#FFFFFF"
        }

        Rectangle {
            id: hideButton
            height: 50
            width: 50
            color: "#00000000"
            anchors {
                top: chatIcon.top
                right: parent.right
                rightMargin: 43
            }
            Image {
                id: hideIcon
                source: "../../../icons/android/hide.svg"
                anchors {
                    right: parent.right
                    horizontalCenter: parent.horizontalCenter
                }
            }
            HifiStyles.FiraSansRegular {
                anchors {
                    top: hideIcon.bottom
                    horizontalCenter: hideIcon.horizontalCenter
                    topMargin: 12
                }
                text: "HIDE"
                color: "#FFFFFF"
                font.pixelSize: hifi.fonts.pixelSize * 0.75;
            }
        
            MouseArea {
                anchors.fill: parent
                onClicked: {
                    hide();
                }
            }
        }

        TextField {
            id: input
            Keys.onReturnPressed: sendMessage()
            onTextChanged: textChangedHandler()
            y: 110
            height: 40
            width: 500 // parent.width - sendButton.width - 15
            anchors.left: chatIcon.left
            font.pointSize: 6
            font.bold: false
            style: TextFieldStyle {
                    textColor: "black"
                    background: Rectangle {
                        radius: 2
                        implicitWidth: 100
                        implicitHeight: 24
                        border.color: "#333"
                        border.width: 1
                    }
                }
        }

        HifiControlsUit.ImageButton {
            width: 140
            height: 35
            text: "SEND"
            source: "../../../images/button.svg"
            hoverSource: "../../../images/button-a.svg"
            fontSize: 18
            fontColor: "#2CD8FF"
            hoverFontColor: "#FFFFFF"
            anchors {
                verticalCenter: input.verticalCenter
                right: hideButton.right
                leftMargin: 10
            }
            onClicked: sendMessage()
        }

        ListView {
            id: chatView
            width: parent.width-5
            height: parent.height - y - 5
            anchors {
                top: input.bottom
                topMargin: 5
                horizontalCenter: parent.horizontalCenter
                left: input.left
            }
            model: chatContent
            clip: true
            delegate: Component {
                Row {
                    Text {
                        font.pointSize: 6
                        text: transmitter?transmitter:""
                        color: textColor
                    }
                    Text {
                        font.pointSize: 6
                        text: content
                        color: "#ffffff"
                    }

                }

            
            }
        }
            
/*
            Text {
                id: otherTyping
                anchors.top: input.bottom
                anchors.left: parent.left
                font.pointSize: 4
                font.bold: false
            }
*/


    }

    property var usersColors : {} 
    property int usersCount : 0
                                // 'red',  'orange',  'yellow',  'green',    'cyan',    'blue',   'magenta'
    property var baseColors : [ '#EB3345', '#F0851F', '#FFCD29', '#94C338', '#11A6C5', '#294C9F', '#C01D84' ];

    function getNextColor(n) {
        var N = baseColors.length;
        if (n < baseColors.length) {
            return baseColors[n];
        } else {
            var baseColor = baseColors[n % N];
            var d = (n / N) % 10;
            var c2 = "" + Qt.lighter(baseColor, 1 + d / 10);
            return c2;
        }
    }

    function getColorForUser(uuid) {
        if (usersColors == undefined) {
            usersColors = {};
        }
        if (!usersColors.hasOwnProperty(uuid)) {
            usersColors[uuid] = getNextColor(usersCount);
            usersCount = usersCount + 1;
        }
        return usersColors[uuid];
    }


    Timer {
        id: typingTimer
        interval: 1000; 
        running: false; 
        repeat: false;
        onTriggered: typingTimerTriggered();
    }

    function textChangedHandler()
    {
        //console.log("[CHAT] text changed");
        type();
    }


    function typingTimerTriggered() {
        typing = false;
        handleEndTyping();
    }

    function fromScript(message) {
        //console.log("[CHAT] fromScript " + JSON.stringify(message));
        switch (message.type) {
            case "ReceiveChatMessage":
                showMessage(message.avatarID, 
                            message.displayName, 
                            message.message, 
                            message.data);
                break;
            case "LogMessage":
                logMessage(message.message);
                //scrollChatLog();
                break;
            case "refreshTyping":
                updateAvatarTypingText ( message.displayNames );
                break;
            case "updateSettings":
                // Update anything that might depend on the settings.
                break;
            case "clearChat":
                chatContent.clear();
                break;
            default:
        }
    }

    function showMessage(avatarID, displayName, message, data) {
        chatContent.append({ transmitter: displayName+": ", content: message, textColor: getColorForUser(avatarID) });
    }

    // Append a log message
    function logMessage(message) {
        chatContent.append({content: message, textColor: "#EEEEEEFF"});
    }

    function sendMessage()
    {
        // toogle focus to force end of input method composer
        var hasFocus = input.focus;
        input.focus = false;

        var data = input.text
        input.text = "";
    
        if (data == '') {
            emptyChatMessage();
        } else {
            handleChatMessage(data, {});
        }

        
        //input.focus = hasFocus;
        Qt.inputMethod.hide();
    }

    // The user entered an empty chat message.
    function emptyChatMessage() {
        sendToScript ({ type: "EmptyChatMessage" });
    }

    // The user entered a non-empty chat message.
    function handleChatMessage(message, data) {
        //console.log("handleChatMessage", message);
        sendToScript({
                type: "HandleChatMessage",
                message: message,
                data: data
            });
    }

    // Call this on every keystroke.
    function type() {
        //console.log("[CHAT] type");
        if (typing && input.text == "") {
            // endTyping
            return;
        }
        beginTyping();
        handleType();
    }

   

    function updateAvatarTypingText(displayNamesTyping) {
        //console.log ("[CHAT] updateAvatarTypingText " + displayNamesTyping + " (" + displayNamesTyping.length+")");
        var str = "";

        for (var i=0; i < displayNamesTyping.length; i++) {
            str += displayNamesTyping[i];
            if (i < displayNamesTyping.length - 1) {
                str += ", ";
            }
        }

        if (displayNamesTyping.length <= 0) {
            //otherTyping.text="";
        } else if (displayNamesTyping.length == 1) {
            //otherTyping.text = str + " is typing";
        } else {
            //otherTyping.text = str + " are typing";
        }

    }

    function beginTyping() {
        //console.log("[CHAT] beginTyping");
        typingTimer.restart();

        if (typing) {
            return;
        }

        typing = true;
        handleBeginTyping();
    }

    // Clear the typing timer and notify if we're finished.
    function endTyping() {
        typingTimer.stop();

        if (!typing) {
            return;
        }

        typing = false;
        handleEndTyping();
    }

    // Notify the interface script when we begin typing.
    function handleBeginTyping() {
        sendToScript({ type: "BeginTyping" });
    }

    // Notify the interface script on every keystroke.
    function handleType() {
        sendToScript({ type: "Type" });
    }

    // Notify the interface script when we end typing.
    function handleEndTyping() {
        sendToScript({ type: "EndTyping" });
    }


	Component.onCompleted: {
        //console.log("[CHAT] qml loaded");
	}
}
