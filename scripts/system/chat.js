"use strict";
//
//  chat.js
//  scripts/system/
//
//  Created by Gabriel Calero & Cristian Duarte on 15 Sep 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var window;

var logEnabled = false;
var isVisible = false;
var sendTyping = true; // Send typing begin and end notification.


var channelName = "Chat"; // Unique name for channel that we listen to.
var chatName = ''; // The user's name shown in chat.

var typingAvatars = []; // Associative array typingAvatars[avatarId]=displayName

function printd(str) {
    if (logEnabled)
        print("[chat.js] " + str);
}

function init() {
    Messages.subscribe(channelName);
    Messages.messageReceived.connect(onChatMessageReceived);
    loadSettings();
}

// Load the persistent variables from the Settings, with defaults.
function loadSettings() {
    chatName = Settings.getValue('Chat_chatName', MyAvatar.displayName);
    printd("loadSettings: chatName", chatName);
    if (!chatName) {
        chatName = randomAvatarName();
    }
    printd("loadSettings: now chatName", chatName);
    //chatLogMaxSize = Settings.getValue('Chat_chatLogMaxSize', 100);
    sendTyping = Settings.getValue('Chat_sendTyping', true);
    //identifyAvatarDuration = Settings.getValue('Chat_identifyAvatarDuration', 10);
    //identifyAvatarLineColor = Settings.getValue('Chat_identifyAvatarLineColor', { red: 0, green: 255, blue: 0 });
    //identifyAvatarMyJointName = Settings.getValue('Chat_identifyAvatarMyJointName', 'Head');
    //identifyAvatarYourJointName = Settings.getValue('Chat_identifyAvatarYourJointName', 'Head');
    //speechBubbleDuration = Settings.getValue('Chat_speechBubbleDuration', 10);
    //speechBubbleTextColor = Settings.getValue('Chat_speechBubbleTextColor', {red: 255, green: 255, blue: 255});
    //speechBubbleBackgroundColor = Settings.getValue('Chat_speechBubbleBackgroundColor', {red: 0, green: 0, blue: 0});
    //speechBubbleOffset = Settings.getValue('Chat_speechBubbleOffset', {x: 0.0, y: 0.3, z:0.0});
    //speechBubbleJointName = Settings.getValue('Chat_speechBubbleJointName', 'Head');
    //speechBubbleLineHeight = Settings.getValue('Chat_speechBubbleLineHeight', 0.05);
    
    saveSettings();
}

// Save the persistent variables to the Settings.
function saveSettings() {
    Settings.setValue('Chat_chatName', chatName);
    printd("saveSettings: chatName", chatName, "or", Settings.getValue('Chat_chatName', 'xxx'));
    //Settings.setValue('Chat_chatLogMaxSize', chatLogMaxSize);
    Settings.setValue('Chat_sendTyping', sendTyping);
    //Settings.setValue('Chat_identifyAvatarDuration', identifyAvatarDuration);
    //Settings.setValue('Chat_identifyAvatarLineColor', identifyAvatarLineColor);
    //Settings.setValue('Chat_identifyAvatarMyJointName', identifyAvatarMyJointName);
    //Settings.setValue('Chat_identifyAvatarYourJointName', identifyAvatarYourJointName);
    //Settings.setValue('Chat_speechBubbleDuration', speechBubbleDuration);
    //Settings.setValue('Chat_speechBubbleTextColor', speechBubbleTextColor);
    //Settings.setValue('Chat_speechBubbleBackgroundColor', speechBubbleBackgroundColor);
    //Settings.setValue('Chat_speechBubbleOffset', speechBubbleOffset);
    //Settings.setValue('Chat_speechBubbleJointName', speechBubbleJointName);
    //Settings.setValue('Chat_speechBubbleLineHeight', speechBubbleLineHeight);
}

// Reset the Settings and persistent variables to the defaults.
function resetSettings() {
    Settings.setValue('Chat_chatName', null);
    //Settings.setValue('Chat_chatLogMaxSize', null);
    Settings.setValue('Chat_sendTyping', null);
    //Settings.setValue('Chat_identifyAvatarDuration', null);
    //Settings.setValue('Chat_identifyAvatarLineColor', null);
    //Settings.setValue('Chat_identifyAvatarMyJointName', null);
    //Settings.setValue('Chat_identifyAvatarYourJointName', null);
    //Settings.setValue('Chat_speechBubbleDuration', null);
    //Settings.setValue('Chat_speechBubbleTextColor', null);
    //Settings.setValue('Chat_speechBubbleBackgroundColor', null);
    //Settings.setValue('Chat_speechBubbleOffset', null);
    //Settings.setValue('Chat_speechBubbleJointName', null);
    //Settings.setValue('Chat_speechBubbleLineHeight', null);

    loadSettings();
}

  // Update anything that might depend on the settings.
function updateSettings() {
    sendToQml({ type: "updateSettings" }); 
}


function fromQml(message) { // messages are {method, params}, like json-rpc. See also sendToQml.
    var data;
    printd("[CHAT] fromQml " + JSON.stringify(message));
    switch (message.type) {
    case 'HandleChatMessage':
        handleChatMessage(message.message, message.data);
        break;
    case 'BeginTyping': 
        beginTyping();
        break;
    case 'EndTyping':
        endTyping();
    default:
        print('[chat.js] Unrecognized message from chat.qml:', JSON.stringify(message));
    }
}
function sendToQml(message) {
    if (!window) {
        print("[CHAT] There is no window object");
    }
    window.sendToQml(message);
}

module.exports = {
    init: function() {
        init();
        window = new QmlFragment({
            menuId: "hifi/android/chat",
            visible: false
        });
    },
    show: function() {
        if (window) {
            window.fromQml.connect(fromQml);
            window.setVisible(true);
            isVisible = true;
        }
    },
    hide: function() {
        if (window) {
            window.setVisible(false);
        }
        isVisible = false;
    },
    destroy: function() {
        Messages.unsubscribe(channelName);
        Messages.messageReceived.disconnect(onChatMessageReceived);
        if (window) {
            window.fromQml.disconnect(fromQml);   
            window.close();
            window = null;
        }
    },
    isVisible: function() {
        return isVisible;
    },
    width: function() {
        return window ? window.size.x : 0;
    },
    height: function() {
        return window ? window.size.y : 0;
    },
    position: function() {
        return window && isVisible ? window.position : null;
    }
};

function onChatMessageReceived(channel, message, senderID) {
    // Ignore messages to any other channel than mine.
    if (channel != channelName) {
        print("Chat.js: unexpected channel " + channel);
        return;
    }

    // Parse the message and pull out the message parameters.
    var messageData = JSON.parse(message);
    var messageType = messageData.type;

    printd("[CHAT] onChatMessageReceived " + JSON.stringify(messageData));

    switch (messageType) {
        case 'TransmitChatMessage':
            handleTransmitChatMessage(messageData.avatarID, messageData.displayName, messageData.message, messageData.data);
            break;
        case 'AvatarBeginTyping':
            handleAvatarBeginTyping(messageData.avatarID, messageData.displayName);
            break;
        case 'AvatarEndTyping':
            handleAvatarEndTyping(messageData.avatarID, messageData.displayName);
            break;
        case 'Who':
            handleWho(messageData.myAvatarID);
            break;
        case 'ReplyWho':
            handleReplyWho(messageData.myAvatarID, messageData.avatarID, messageData.displayName, messageData.message, messageData.data);
            break;
        default:
            print("onChatMessageReceived: unknown messageType", messageType, "message", message);
            break;

    }

}

// We got a chat message from the channel. 
// Trim the chat log, save the latest message in the chat log, 
// and show the message on the tablet, if the chat page is showing.
function handleTransmitChatMessage(avatarID, displayName, message, data) {
    printd("[CHAT] handleTransmitChatMessage " + displayName + ": " + message);
    sendToQml({ type: "ReceiveChatMessage", 
                avatarID: avatarID,
                displayName: displayName,
                message: message,
                data: data}
             );
}

// Notification that somebody started typing.
function handleAvatarBeginTyping(avatarID, displayName) {
    printd("[CHAT] handleAvatarBeginTyping avatarID: " + avatarID + ":" + displayName);
    if (avatarID != MyAvatar.sessionUUID && !typingAvatars[avatarID]) {
        typingAvatars[avatarID] = displayName;
    }
    refreshTyping();
}

// Notification that somebody stopped typing.
function handleAvatarEndTyping(avatarID, displayName) {
    printd("[CHAT] handleAvatarEndTyping avatarID: " + avatarID + ":" + displayName);
    if (typingAvatars[avatarID]) {
        delete typingAvatars[avatarID];
    }
    refreshTyping();
}

function refreshTyping() {
    var displayNames = [];
    for (var id in typingAvatars) {
        displayNames.push(typingAvatars[id]);
    }
    sendToQml( {type: "refreshTyping", displayNames: displayNames});
}
// Send a reply to a "Who" message, with a friendly message, 
// our avatarID and our displayName. myAvatarID is the id
// of the avatar who send the Who message, to whom we're
// responding.
function handleWho(myAvatarID) {
    var avatarID = MyAvatar.sessionUUID;
    if (myAvatarID == avatarID) {
        printd("[CHAT] don't reply to myself (who msg)");
        // Don't reply to myself.
        return;
    }

    printd("[CHAT] ReplyWho");
    var message = "I'm here!";
    var data = {};

    Messages.sendMessage(
        channelName,
        JSON.stringify({
            type: 'ReplyWho',
            myAvatarID: myAvatarID,
            avatarID: avatarID,
            displayName: chatName,
            message: message,
            data: data
        }));
}

// Receive the reply to a "Who" message. Ignore it unless we were the one
// who sent it out (if myAvatarIS is our avatar's id).
function handleReplyWho(myAvatarID, avatarID, displayName, message, data) {
    if (myAvatarID != MyAvatar.sessionUUID) {
        return;
    }
    printd("[CHAT] handleReplyWho " +  avatarID);
    //receiveChatMessageTablet(avatarID, displayName, message, data);
}

// Make a hopefully unique random anonymous avatar name.
function randomAvatarName() {
    return 'Anon_' + Math.floor(Math.random() * 1000000);
}

// Handle input form the user, possibly multiple lines separated by newlines.
// Each line may be a chat command starting with "/", or a chat message.
function handleChatMessage(message, data) {

    var messageLines = message.trim().split('\n');
    printd("[CHAT] handleChatMessage: " + message);

    for (var i = 0, n = messageLines.length; i < n; i++) {
        var messageLine = messageLines[i];
        printd("[CHAT] messageLine: " + messageLine);
        if (messageLine.substr(0, 1) == '/') {
            handleChatCommand(messageLine, data);
        } else {
            transmitChatMessage(messageLine, data);
        }
    }

}

// Handle a chat command prefixed by "/".
function handleChatCommand(message, data) {
    var commandLine = message.substr(1);
    var tokens = commandLine.trim().split(' ');
    var command = tokens[0];
    var rest = commandLine.substr(command.length + 1).trim();

    switch (command) {
        case '?':
        case 'help':
            logMessage('Text Chat Help', null);
            logMessage('Type "/?" or "/help" for help, which is this!', null);
            logMessage('Type "/name <name>" to set your chat name, or "/name" to use your display name, or a random name if that is not defined.', null);
//            logMessage('Type "/shutup" to shut up your overhead chat message.', null);
            logMessage('Type "/say <something>" to say something.', null);
            logMessage('Type "/clear" to clear your chat log.', null);
            logMessage('Type "/who" to ask who is here to chat.', null);
//            logMessage('Type "/bigger", "/smaller" or "/normal" to change your avatar size.', null);
            logMessage('(Sorry, that\'s all there is so far!)', null);
            break;
        case 'name':
            if (rest == '') {
                if (MyAvatar.displayName) {
                    chatName = MyAvatar.displayName;
                    logMessage('Your chat name has been set to your display name "' + chatName + '".', null);
                } else {
                    chatName = randomAvatarName();
                    logMessage('Your avatar\'s display name is not defined, so your chat name has been set to "' + chatName + '".', null);
                }
            } else {
                chatName = rest;
                logMessage('Your chat name has been set to "' + chatName + '".', null);
            }
            saveSettings();
            break;
/*        case 'shutup':
            popDownSpeechBubble();
            logMessage('Overhead chat message shut up.', null);
            break;
*/
        case 'say':
            if (rest == '') {
                //emptyChatMessage(data);
            } else {
                transmitChatMessage(rest, data);
            }
            break;

        case 'who':
            transmitWho();
            break;

        case 'clear':
            clearChatLog();
            break;

/*        case 'bigger':
            biggerSize();
            break;

        case 'smaller':
            smallerSize();
            break;

        case 'normal':
            normalSize();
            break;
*/
        case 'resetsettings':
            resetSettings();
            updateSettings();
            break;
/*
        case 'speechbubbleheight':
            var y = parseInt(rest);
            if (!isNaN(y)) {
                speechBubbleOffset.y = y;
            }
            saveSettings();
            updateSettings();
            break;

        case 'speechbubbleduration':
            var duration = parseFloat(rest);
            if (!isNaN(duration)) {
                speechBubbleDuration = duration;
            }
            saveSettings();
            updateSettings();
            break;
*/
        default:
            logMessage('Unknown chat command. Type "/help" or "/?" for help.', null);
            break;
    }
}

 // Trim the chat log, save the latest log message in the chat log, 
// and show the message on the tablet, if the chat page is showing.
function logMessage(message, data) {
    sendToQml( {type: "LogMessage", message: message, data: data});
}

// Send out a chat message to everyone.
function transmitChatMessage(message, data) {
    printd("[CHAT] transmitChatMessage: " + message);
    Messages.sendMessage(
        channelName, 
        JSON.stringify({
            type: 'TransmitChatMessage',
            avatarID: MyAvatar.sessionUUID,
            displayName: chatName,
            message: message,
            data: data
        }));

}

// Send out a "Who" message, including our avatarID as myAvatarID,
// which will be sent in the response, so we can tell the reply
// is to our request.
function transmitWho() {
    logMessage("Who is here?", null);
    Messages.sendMessage(
        channelName,
        JSON.stringify({
            type: 'Who',
            myAvatarID: MyAvatar.sessionUUID
        }));
}

function clearChatLog() {
    printd("[CHAT] clearChatLog command");
    sendToQml( {type: "clearChat"} );
}

// Notification that we began typing. 
// Notify everyone that we started typing.
function beginTyping() {
    printd("[chat] beginTyping " + chatName + " (" + MyAvatar.sessionUUID +")" );
    if (!sendTyping) {
        return;
    }
    refreshTyping();

    Messages.sendMessage(
        channelName, 
        JSON.stringify({
            type: 'AvatarBeginTyping',
            avatarID: MyAvatar.sessionUUID,
            displayName: chatName
        })
    );

}

// Notification that we stopped typing.
// Notify everyone that we stopped typing.
function endTyping() {
    if (!sendTyping) {
        return;
    }

    Messages.sendMessage(
        channelName, 
        JSON.stringify({
            type: 'AvatarEndTyping',
            avatarID: MyAvatar.sessionUUID,
            displayName: chatName
        }));
}


//init();
