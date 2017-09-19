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
import "../../styles-uit"
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

    x: 10
    y: 10

	width: parent ? parent.width - 20 : 0
	height: parent ? parent.height - 40 : 0

	ListModel {
        id: chatContent
        ListElement {
            content: "Connected to chat server"
        }
    }

    Rectangle {
        id: background
        z: 0
        anchors.fill: parent
        color: "#004444"
    }

    Rectangle {
        id: chatBox
        // opacity: 1

        anchors.centerIn: top

        color: "#5d5b59"
        border.color: "black"
        border.width: 1
        radius: 5
        anchors.fill: parent

        Item {
            anchors.fill: parent
            anchors.margins: 10

            TextField {
                id: input
                Keys.onReturnPressed: sendMessage()
                onTextChanged: textChangedHandler()
                height: sendButton.height
                width: parent.width - sendButton.width - 15
                anchors.left: parent.left
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

            Button {
                id: sendButton
                anchors.right: parent.right
                width: 100
                height: 50
                text: "Send"
                onClicked: sendMessage()
                style: ButtonStyle {
			      label: Text {
			        renderType: Text.NativeRendering
			        verticalAlignment: Text.AlignVCenter
			        horizontalAlignment: Text.AlignHCenter
			        font.family: "Helvetica"
			        font.pointSize: 6
			        color: "blue"
			        text: control.text
			      }
			    }
            }

            Text {
                id: otherTyping
                anchors.top: input.bottom
                anchors.left: parent.left
                font.pointSize: 4
                font.bold: false
            }

            Rectangle {
                height: parent.height - input.height - 15
                width: parent.width;
                color: "#d7d6d5"
                anchors.top: otherTyping.bottom
                border.color: "black"
                border.width: 1
                radius: 5

                ListView {
                    id: chatView
                    width: parent.width-5
                    height: parent.height-5
                    anchors.centerIn: parent
                    model: chatContent
                    clip: true
                    delegate: Component {
                        Text {
                            font.pointSize: 6
                            text: modelData
                        }
                	}
            	}
            }
        }
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
        //console.log("[CHAT] show message (qml)");
        var c = displayName + ": " + message;
        chatContent.append({content: c});
    }

    // Append a log message
    function logMessage(message) {
        chatContent.append({content: message});
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

        
        input.focus = hasFocus;

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
            otherTyping.text="";
        } else if (displayNamesTyping.length == 1) {
            otherTyping.text = str + " is typing";
        } else {
            otherTyping.text = str + " are typing";
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
