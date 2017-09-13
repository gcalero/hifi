"use strict";
//
//  goto-android.js
//  scripts/system/
//
//  Created by Gabriel Calero & Cristian Duarte on 12 Sep 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var window;


var logEnabled = false;
function printd(str) {
    if (logEnabled)
        print("[goto-android.js] " + str);
}

function init() {    
}

function fromQml(message) { // messages are {method, params}, like json-rpc. See also sendToQml.
    switch (message.method) {
    case 'shownChanged': 
        if (notifyShownChange) {
            notifyShownChange(message.params.shown);
        } ;
        break;
    default:
        print('[goto-android.js] Unrecognized message from AddressBarDialog-android.qml:', JSON.stringify(message));
    }
}

function sendToQml(message) {
    window.sendToQml(message);
}

var isVisible = false;
var notifyShownChange;
module.exports = {
    init: function() {
        window = new QmlFragment({
            menuId: "AddressBarDialog-android",
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
    },
    setOnShownChange: function(f) {
        notifyShownChange = f;
    }


};

init();
