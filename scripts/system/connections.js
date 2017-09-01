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

var logEnabled = false;
function printd(str) {
    if (logEnabled)
        print("[connections.js] " + str);
}

function init() {    
   
    
    //&&tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");
    //tablet.fromQml.connect(fromQml);
}

var first=true; // temporary
function fromQml(message) { // messages are {method, params}, like json-rpc. See also sendToQml.
    var data;
    //printd("[CONNECTIONS] fromQml " + message.method);
    switch (message.method) {
    case 'refreshAll': 
        // all & nearby connections
        var allFilter = function(c) { return true; };
        var nearbyFilter = isNearbyConnectionFunction(Camera.position, Window.location.domainId);
        refreshConnections([
                            {filter: allFilter, sendToQmlMethod: 'allConnections'},
                            {filter: nearbyFilter, sendToQmlMethod: 'nearbyConnections'}
                           ]);
        break;
    case 'locateFriend':
        locateFriend(message.params.username);
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

/*
function isFriend (c) {
    return c.connection === "friend";
};
*/
/*
function isOnline (c) {
    return c.online;
}
*/
// Window.location.domainId returns a domain like {4840a904-5a71-41c0-b7ca-945d1674be2b}
// while other APIs return the id without the curly brackets
function normalizeDomainId(domainId) {
    if (domainId.substring( 0, domainId.length) !== "{" || 
        domainId.substring( domainId.length - 1, domainId.length) !== "}") {
        return "{" + domainId + "}";
    }
    return domainId;
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

function isNearbyConnectionFunction(myPosition, myDomainId) {
    return function (c) {
        if (!(c && c.location && c.location.root && c.location.root.domain)) {
            return false;
        }
        if (myDomainId === normalizeDomainId(c.location.root.domain.id)) {
            var path = c.location.path;
            var cPosition = parseLocationFromPath(path);
            var distance = Vec3.distance(cPosition, myPosition);
            return distance <= Settings.getValue('connections/nearDistance');
        }
        return false;
    }
}

function formatConnection(conn) { // get into the right format
        var formattedSessionId = conn.location.node_id || '';
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

function refreshConnections(filterParams) { // Update all the usernames that I am entitled to see, using my login but not dependent on canKick.
    getAvailableConnections(function (conns) {
    var avatars = AvatarList.getAvatarIdentifiers();
        for (var i=0; i < filterParams.length; i++) {
            var x = filterParams[i];
            var filtered = conns.filter(x.filter);
            //filtered = conns;
            sendToQml({ method: x.sendToQmlMethod, params: filtered.map(formatConnection)});            
        }
    });
}

var isVisible = false;

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
        if (window) {
            window.fromQml.connect(fromQml);
            // temporary fix to avoid reconnection
            if (first) {
                Account.checkAndSignalForAccessToken();
                first=false;
            }
            window.setVisible(true);
            isVisible = true;
        }
    },
    hide: function() {
        //printd("[CONNECTIONS] hide");
        if (window) {
            window.setVisible(false);
        }
        isVisible = false;
        //tablet.gotoHomeScreen();
    },
    destroy: function() {
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
    }
};

init();
