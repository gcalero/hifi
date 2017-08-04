"use strict";
//
//  friends.js
//  scripts/system/
//
//  Created by Gabriel Calero & Cristian Duarte on 24 Jul 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//


//print("[friends.js]");

(function() {
    var tablet = null;
    var button;
    var friendsQmlSource = "Friends.qml";
    var request = Script.require('request').request;

var FRIENDS_ICONS = {
    icon: "icons/tablet-icons/users-i.svg",
    activeIcon: "icons/tablet-icons/users-a.svg"
};

function fromQml(message) { // messages are {method, params}, like json-rpc. See also sendToQml.
    var data;
    switch (message.method) {
    case 'refreshNearbyFriends':
        var myPosition = Camera.position; // or MyAvatar.position ? or Camera.position & (1, 0, 1)
        var myDomainId = Window.location.domainId;
        var filter = isNearFriendFunction(myPosition, myDomainId);
        refreshConnections(filter, 'nearbyFriends');
        break;
    case 'refreshOnlineFriends':
        var filter = function(c) { return isFriend(c) && isOnline(c); };
        refreshConnections(filter, 'onlineFriends');
        break;
    default:
        print('[friends.js] Unrecognized message from Friends.qml:', JSON.stringify(message));
    }
}

function avatarAdded(QUuid) {
    //print("[FRIENDS] avatar added " + QUuid + " at " + JSON.stringify(AvatarList.getAvatar(QUuid).position));
    //var avatarDatum = getUserDatumFromAvatar(QUuid);
    //if (!avatarDatum) return;
    //sendToQml({ method: 'addUser', params: { user: avatarDatum} });
}

function avatarRemoved(QUuid) {
    //print("[FRIENDS] avatar removed " + QUuid);
    //sendToQml({ method: 'removeUser', params: { userId: QUuid}});
}

function sendToQml(message) {
    tablet.sendToQml(message);
}

function startup() {
    tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");
    tablet.fromQml.connect(fromQml);
}

startup();

//
// Mouse events
//

function mousePressOrTouchEnd(event) {
//    print("[friends.js] mousePressOrTouchEnd");
}

function touchEnd(event) {
//    print("[friends.js] touchEnd");
}

function touchUpdate(event) {
//    print("[friends.js] touchUpdate");
}

var onFriendsOnScreen = false;
var shouldActivateButton = false;

function onScreenChanged(type, url) {
    // for toolbar mode: change button to active when window is first openend, false otherwise.
    button.editProperties({isActive: shouldActivateButton});
    shouldActivateButton = false;
}


function onClicked() {
    if (tablet) {
        if (onFriendsOnScreen) {
            shouldActivateButton = true;
            tablet.loadQMLSource(friendsQmlSource);
            Account.checkAndSignalForAccessToken();
        } else {
            tablet.gotoHomeScreen();
        }
        onFriendsOnScreen = !onFriendsOnScreen;
    }
}

/*
function getUserDatumFromAvatar(avatarId) {
        var avatar = AvatarList.getAvatar(avatarId);
        var name = avatar.sessionDisplayName;

        if (!name) {
            AvatarManager.getAvatar(avatarId);
            return;
        }

        var myPosition = Camera.position;

        var avatarDatum = {
            profileUrl: '',
            displayName: name,
            userName: '',
            connection: '',
            sessionId: avatarId || '',
            isPresent: true,
            isReplicated: avatar.isReplicated,
            position: avatar.position,
            distance: Vec3.distance(avatar.position, myPosition)
        };

        // Everyone needs to see admin status. Username and fingerprint returns default constructor output if the requesting user isn't an admin.
        Users.requestUsernameFromID(avatarId);

        if (avatarId) {
            //addAvatarNode(id); // No overlay for ourselves
            //avatarsOfInterest[id] = true;
        } else {
            // Return our username from the Account API
            avatarDatum.userName = Account.username;
        }
        return avatarDatum;
}
function refreshNearbyFriends() {
    var data = [], avatars = AvatarList.getAvatarIdentifiers();
    avatars.forEach(function (id) {
        var avatarDatum = getUserDatumFromAvatar(id);
        if (!avatarDatum) return;
        var distance = Settings.getValue('friends/nearDistance');
        if (avatarDatum.distance && avatarDatum.distance <= distance) {
            data.push(avatarDatum);
        }

    });
    print("[FRIENDS] refreshNearbyFriends data " + data);
    sendToQml({ method: 'nearbyFriends', params: data });
}
*/




//
// User management services
//
// These are prototype versions that will be changed when the back end changes.
var METAVERSE_BASE = location.metaverseServerUrl;

function requestJSON(url, callback) { // callback(data) if successfull. Logs otherwise.
    request({
        uri: url
    }, function (error, response) {
        if (error || (response.status !== 'success')) {
            print("Error: unable to get", url,  error || response.status);
            return;
        }
        callback(response.data);
    });
}

function getProfilePicture(username, callback) { // callback(url) if successfull. (Logs otherwise)
    // FIXME Prototype scrapes profile picture. We should include in user status, and also make available somewhere for myself
    request({
        uri: METAVERSE_BASE + '/users/' + username
    }, function (error, html) {
        var matched = !error && html.match(/img class="users-img" src="([^"]*)"/);
        if (!matched) {
            print('Error: Unable to get profile picture for', username, error);
            callback('');
            return;
        }
        callback(matched[1]);
    });
}

function getAvailableConnections(callback) { // callback([{usename, location}...]) if successfull. (Logs otherwise)
    url = METAVERSE_BASE + '/api/v1/users?'
    url += 'filter=connections'; // regardless of whether online
    requestJSON(url, function (connectionsData) {
        callback(connectionsData.users);
    });
}

function isFriend (c) { 
    return c.connection === "friend";
};

function isOnline (c) {
    return c.online;
}

// Window.location.domainId returns a domain like {4840a904-5a71-41c0-b7ca-945d1674be2b}
// while other APIs return the id without the curly brackets
function normalizeDomainId(domainId) {
    if (domainId.substring( 0, domainId.length) !== "{" || 
        domainId.substring( domainId.length - 1, domainId.length) !== "}") {
        return "{" + domainId + "}";
    }
    return domainId;
}

function isNearFriendFunction(myPosition, myDomainId) {
    return function (c) {
        if (!isFriend(c) || !(c && c.location && c.location.root && c.location.root.domain)) {
            return false;
        }
        if (myDomainId === normalizeDomainId(c.location.root.domain.id)) {
            var path = c.location.path;
            path = path.replace(/\//g, ",");
            var match = path.split(",");
            var x=match[1], y=match[2], z=match[3];
            var cPosition =  { x: x, y: y, z: z };
            var distance = Vec3.distance(cPosition, myPosition);
            return distance <= Settings.getValue('friends/nearDistance');
        }
        return false;
    }
}

function formatFriendConnection(conn) { // get into the right format
        var formattedSessionId = conn.location.node_id || '';
        if (formattedSessionId !== '' && formattedSessionId.indexOf("{") != 0) {
            formattedSessionId = "{" + formattedSessionId + "}";
        }
/*        for(var k in conn) {
            print("[FRIENDS] user key:" +  k + conn[k]);
        }

        for (var k in conn.location) {
            print("[FRIENDS] user location key:" +  k + conn.location[k]);
        }
        for (var k in user.images) {
            print("[FRIENDS] user images key:" +  k + user.images[k]);
        }*/
//        print("[FRIENDS] frob sessionId:" + formattedSessionId + "userName: " + conn.username + " connection: " + conn.connection + " profileUrl: " + conn.images.thubnail + " placeName: " + ((conn.location.root || conn.location.domain || {}).name || ''));
        return {
            sessionId: formattedSessionId,
            userName: conn.username,
            domain: conn.location.domain,
            connection: conn.connection,
            profileUrl: conn.images.thumbnail,
            placeName: (conn.location.root || conn.location.domain || {}).name || ''
        };
    }

function refreshConnections(filterF, sendToQmlMethod) { // Update all the usernames that I am entitled to see, using my login but not dependent on canKick.
    getAvailableConnections(function (conns) {
        var filtered = conns.filter(filterF);
        sendToQml({ method: sendToQmlMethod, params: filtered.map(formatFriendConnection)});
    });
    
}

button = tablet.addButton({
    icon: FRIENDS_ICONS.icon, // FIXME - use correct icon
    activeIcon: FRIENDS_ICONS.activeIcon,
    text: "Friends",
    sortOrder: 2
});

tablet.screenChanged.connect(onScreenChanged);
button.clicked.connect(onClicked);

//Controller.keyPressEvent.connect(keyPressEvent);
Controller.mousePressEvent.connect(mousePressOrTouchEnd);
Controller.touchEndEvent.connect(touchEnd);

Controller.touchUpdateEvent.connect(touchUpdate);
AvatarList.avatarAddedEvent.connect(avatarAdded);
AvatarList.avatarRemovedEvent.connect(avatarRemoved);


Script.scriptEnding.connect(function () {
    tablet.screenChanged.disconnect(onScreenChanged);
    button.clicked.disconnect(onClicked);
    if (tablet) {
        tablet.removeButton(button);
    }
//    Controller.keyPressEvent.disconnect(keyPressEvent);
    Controller.mousePressEvent.disconnect(mousePressOrTouchEnd);
    Controller.touchEndEvent.disconnect(mousePressOrTouchEnd);

    AvatarList.avatarAddedEvent.disconnect(avatarAdded);
    AvatarList.avatarRemovedEvent.disconnect(avatarRemoved);
});

}()); // END LOCAL_SCOPE
