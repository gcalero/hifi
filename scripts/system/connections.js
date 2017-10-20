"use strict";
//
//  connections.js
//  scripts/system/
//
//  Created by Gabriel Calero & Cristian Duarte on 24 Jul 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var window;

var request = Script.require('request').request;
var METAVERSE_BASE = location.metaverseServerUrl;

var logEnabled = true;
function printd(str) {
    if (logEnabled)
        print("[connections.js] " + str);
}

function init() {
    AvatarList.avatarAddedEvent.connect(avatarAdded);
    AvatarList.avatarRemovedEvent.connect(avatarRemoved);
}

function avatarAdded(avatarID) {
    populateNearbyUserList();
}

function avatarRemoved(avatarID) {
    populateNearbyUserList();
}

function fromQml(message) { // messages are {method, params}, like json-rpc. See also sendToQml.
    var data;
    //printd("[connections.js] fromQml " + message.method);
    switch (message.method) {
    case 'refreshAll': 
        // all & nearby connections
        var allFilter = function(c) { return true; };
        refreshConnections([
                            {filter: allFilter, sendToQmlMethod: 'allConnections'}
                           ]);
        break;
    case 'refreshNearby':
        populateNearbyUserList();
        break;
    case 'locateFriend':
        locateFriend(message.params.username);
        break;
    case 'hide':
        module.exports.hide();
        module.exports.onHidden();
        break;
    case 'chat':
        module.exports.hide();
        module.exports.onHidden();
        module.exports.openChat(message.params.username);
        break;
    default:
        print('[connections.js] Unrecognized message from Connections.qml:', JSON.stringify(message));
    }
}
function sendToQml(message) {
    window.sendToQml(message);
}

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

function locateFriend(username) {
    var url = METAVERSE_BASE + '/api/v1/users/'+username+'/location';
    requestJSON(url, function(data) {
        var path = data.location && data.location.path ? data.location.path : "";
        var location = parseLocationFromPath(path);
        Camera.position = Vec3.sum(location, {x:0, y:10, z:0});
    });
}

function getAvailableConnections(callback) { // callback([{usename, location}...]) if successfull. (Logs otherwise)
    url = METAVERSE_BASE + '/api/v1/users?'
    url += 'filter=connections'; // regardless of whether online
    requestJSON(url, function (connectionsData) {
        callback(connectionsData.users);
    });
}

function parseLocationFromPath(path) {
    if (!path) return;
    var path = path.replace(/\//g, ",");
    var match = path.split(",");
    var x=parseFloat(match[1]), y=parseFloat(match[2]), z=parseFloat(match[3]);
    //printd("[CONNECTIONS] parseLocationFromPath x " + JSON.stringify({ x: x, y: y, z: z }));
    return { x: x, y: y, z: z };
}

function parseOrientationFromPath(path) {
    if (!path) return;
    var path = path.replace(/\//g, ",");
    var match = path.split(",");
    var x=parseFloat(match[4]), y=parseFloat(match[5]), z=parseFloat(match[6]), w=parseFloat(match[7]);
    return { x: x, y: y, z: z, w: w };
}

function formatConnection(conn) { // get into the right format
    var formattedSessionId = conn.location.node_id || '';
    //print("[NODE_ID] formatConnection location=" + JSON.stringify(conn.location));
    if (formattedSessionId !== '' && formattedSessionId.indexOf("{") != 0) {
        formattedSessionId = "{" + formattedSessionId + "}";
    }
    
    var path = conn.location? conn.location.path : "";
    var location = parseLocationFromPath(path);
    var orientation = parseOrientationFromPath(path);
    return {
        sessionId: formattedSessionId,
        userName: conn.username,
        location: JSON.stringify(location),
        orientation: JSON.stringify(orientation),
        domain: conn.location.domain,
        connection: conn.connection,
        profileUrl: conn.images.thumbnail,
        placeName: (conn.location.root || conn.location.domain || {}).name || ''
    };
}

function formatAvatarData(o) {
    //print("[AVATAR-ID] " + o.id);
    return {
        sessionId: o.id || '',
        profileUrl: '',
        userName: o.avatar.sessionDisplayName,
        displayName: o.avatar.sessionDisplayName,
        location: JSON.stringify(o.avatar.position),
        orientation: JSON.stringify(o.avatar.orientation)
        //profileUrl: conn.images.thumbnail,
        
    };

}

function getConnectionDataForDomain(domain, callback) {
    url = METAVERSE_BASE + '/api/v1/users?'
    url += 'status=' + domain.slice(1, -1); // without curly braces
    requestJSON(url, function (connectionsData) {
        callback(connectionsData.users);
    });
}

function refreshConnections(filterParams) { // Update all the usernames that I am entitled to see, using my login but not dependent on canKick.
    getAvailableConnections(function (conns) {
            for (var i=0; i < filterParams.length; i++) {
                var x = filterParams[i];
                var filtered = conns.filter(x.filter);
                //filtered = conns;
                sendToQml({ method: x.sendToQmlMethod, params: filtered.map(formatConnection)});            
            }
        });
}

function populateNearbyUserList() {
    var avatarIds = AvatarList.getAvatarIdentifiers();
    var avatars = avatarIds.map(function(x) { return {id: x, avatar: AvatarList.getAvatar(x)}; });
    var nearbyFilter = isNearbyAvatarFunction(MyAvatar.position);

    var filtered = avatars.filter(nearbyFilter);
    

    sendToQml({ method: 'nearbyUsers', params: filtered.map(formatAvatarData)});

    //print("[NEARBY] getting connection data for domain: " + location.domainId)
    getConnectionDataForDomain(location.domainId, function (users) {
            //print("[NEARBY] callback connection data " + users.length);
            users.forEach(function (user) {
                //print("[FORMAT-UPD] callback connection data " + JSON.stringify(user));
                //print("[FORMAT-UPD] callback connection data " + JSON.stringify(formatConnection(user)));
                updateUser(formatConnection(user));

            });
        });
}

function updateUser(data) {
    print('[NEARBY] PAL update:' +  data.userName + "(" + data.sessionId + ")");
    sendToQml({ method: 'updateUsername', params: data });
}

function isNearbyAvatarFunction(myPosition) {
    return function (o) {
        if (!o.id) return false;
        var avatar = o.avatar;
        var name = avatar.sessionDisplayName;
        var maxDistance = Settings.getValue('connections/nearDistance');
        if (!name) {
            // Either we got a data packet but no identity yet, or something is really messed up. In any case,
            // we won't be able to do anything with this user, so don't include them.
            // In normal circumstances, a refresh will bring in the new user, but if we're very heavily loaded,
            // we could be losing and gaining people randomly.
            print('No avatar identity data for', o.id);
            return false;
        }

        if (o.id && myPosition && (Vec3.distance(avatar.position, myPosition) > maxDistance)) {
            return false;
        }

        return true;
    }
}

function projectVectorOntoPlane(normalizedVector, planeNormal) {
    return Vec3.cross(planeNormal, Vec3.cross(normalizedVector, planeNormal));
}

function angleBetweenVectorsInPlane(from, to, normal) {
    var projectedFrom = projectVectorOntoPlane(from, normal);
    var projectedTo = projectVectorOntoPlane(to, normal);
    return Vec3.orientedAngle(projectedFrom, projectedTo, normal);
}

var isVisible = false;

var refresh_timer = false;

module.exports = {
    init: function() {
        init();
        window = new QmlFragment({
            menuId: "hifi/tablet/ConnectionsWindow",
            visible: false
        });
    },
    show: function() {
        //printd("[CONNECTIONS] show");
        Controller.setVPadEnabled(false);        
        if (window) {
            window.fromQml.connect(fromQml);
            if (!Account.isLoggedIn()) {
                Account.checkAndSignalForAccessToken();
            }
            window.setVisible(true);
            isVisible = true;
            refreshConnectionsList();
            refresh_timer = Script.setInterval(refreshConnectionsList, 10000);
            printd("refresh set");
        }
    },
    hide: function() {
        //printd("[CONNECTIONS] hide");
        Controller.setVPadEnabled(true);
        if (window) {
            window.fromQml.disconnect(fromQml);   
            window.setVisible(false);
        }
        isVisible = false;
        if (refresh_timer) {
            Script.clearInterval(refresh_timer);
            refresh_timer = false;
            printd("refresh cleared");
        }
        //tablet.gotoHomeScreen();
    },
    destroy: function() {
        AvatarList.avatarAddedEvent.disconnect(avatarAdded);
        AvatarList.avatarRemovedEvent.disconnect(avatarRemoved);
        if (window) {
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
    },
    onHidden: function() {},
    openChat: function(username) {}
};

function refreshConnectionsList() {
    //printd("refresh kicked");
    if (!Account.isLoggedIn()) return;
    //printd("refresh kicked (was logged in)");
    var allFilter = function(c) { return true; };
    refreshConnections([
                        {filter: allFilter, sendToQmlMethod: 'allConnections'}
                       ]);
}
Script.scriptEnding.connect(function() {
    if (refresh_timer) {
        Script.clearInterval(refresh_timer);
        refresh_timer = false;
        //printd("refresh cleared");
    }
});

