"use strict";
//
//  backbutton.js
//  scripts/system/+android
//
//  Created by Gabriel Calero & Cristian Duarte on Apr 06, 2018
//  Copyright 2018 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
(function() { // BEGIN LOCAL_SCOPE

var actionbar;
var backButton;

var logEnabled = true;

function printd(str) {
    if (logEnabled)
        print("[actionbar.js] " + str);
}

function init() {
    actionbar = new QmlFragment({
        qml: "hifi/ActionBar.qml"
    });
    backButton = actionbar.addButton({
        icon: "icons/+android/backward.svg",
        activeIcon: "icons/+android/backward.svg",
        text: "",
        bgOpacity: 0.0,
        hoverBgOpacity: 0.0,
        activeBgOpacity: 0.0
    });
    
    if (!HMD.active) {
        connectButton();
        actionbar.setVisible(true);
    } else {
        actionbar.setVisible(false);
    }

    HMD.displayModeChanged.connect(function (isHMDMode) {
        if (isHMDMode && HMD.active) {
            tearDown();
            actionbar.setVisible(false);
        } else {
            connectButton();
            actionbar.setVisible(true);
        }
    });

}

function onBackPressed() {
   Controller.triggerHapticPulseOnDevice(Controller.findDevice("TouchscreenVirtualPad"), 0.1, 40.0, 0);
}

function onBackClicked() {
   Window.openAndroidActivity("Home", false);
}

function connectButton() {
    if (backButton) {
        backButton.entered.connect(onBackPressed);
        backButton.clicked.connect(onBackClicked);
    }
}

function tearDown() {
    if(backButton) {
        backButton.entered.disconnect(onBackPressed);
        backButton.clicked.disconnect(onBackClicked);
    }
}

Script.scriptEnding.connect(function() {
    tearDown();
});

init();

}()); // END LOCAL_SCOPE
