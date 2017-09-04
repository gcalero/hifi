"use strict";
"use strict";
//
//  android.js
//  scripts/system/
//
//  Created by Gabriel Calero & Cristian Duarte on Aug 24, 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
print("[android.js] outside scope");

(function() { // BEGIN LOCAL_SCOPE

var GODVIEWMODE = Script.require('./godView.js');

var logEnabled = true;
var mode="my view";
var SCREEN_HEIGHT=Window.innerHeight;
var SCREEN_WIDTH=Window.innerWidth;
var BOTTOM_ZONE_HEIGHT=50;
var RIGHT_ZONE_WIDTH=50;
var MIN_SWIPE_VERT=10;
var MIN_SWIPE_HORIZ=10;

var touchInProgress=false;
// vars for swipe up / down
var swipingUp=false, swipingDown=false, swipeLastTouchY=0, initialTouchY=0;
var swipingLeft=false, swipingRight=false, swipeLastTouchX=0, initialTouchX=0;

var connections = Script.require('./connections.js');

var modesBar;
var audiobar;
var audioButton;

function printd(str) {
    if (logEnabled)
        print("[android.js] " + str);
}

function init() {
	// temp while I build bottom bar
    connections.init();

	Controller.touchBeginEvent.connect(touchBegin);
	Controller.touchEndEvent.connect(touchEnd);
	Controller.touchUpdateEvent.connect(touchUpdate);

    Script.update.connect(update);

    modesBar = setupModesBar();

    setupAudioBar();

    GODVIEWMODE.isTouchValid = isGodViewModeValidTouch;
}

function shutdown() {
    Controller.touchBeginEvent.disconnect(touchBegin);
    Controller.touchEndEvent.disconnect(touchEnd);
    Controller.touchUpdateEvent.disconnect(touchUpdate);

    Script.update.disconnect(update);
}

function update() {
    if (HMD.isVrExitRequested()) {
        Menu.setIsOptionChecked("Android", true);
        var isDesktop = Menu.isOptionChecked("Android");
        //onHmdChanged(!isDesktop);
        HMD.resetVrExitRequested();
        if (modesBar) {
            modesBar.restoreMyViewButton();
        }
    }
}

function isGodViewModeValidTouch(coords) {
    var isValid = 
        (
            modesBar == null
            ||
            (
                (coords.x < modesBar.qmlFragment.position.x * 3 || coords.x > modesBar.qmlFragment.position.x * 3 + modesBar.qmlFragment.size.x * 3)
                ||
                (coords.y < modesBar.qmlFragment.position.y * 3 || coords.y > modesBar.qmlFragment.position.y * 3 + modesBar.qmlFragment.size.y * 3)
            )
        ) &&
        (
            connections.position() == null
            ||
            (
                (coords.x < connections.position().x * 3 || coords.x > connections.position().x * 3+ connections.width() * 3)
                ||
                (coords.y < connections.position().y *3 || coords.y > connections.position().y *3 + connections.height() * 3)
            )
        ) && 
        (
            bottombar == null
            ||
            (
                (coords.x < bottombar.position.x * 3 || coords.x > bottombar.position.x * 3 + bottombar.size.x * 3)
                ||
                (coords.y < bottombar.position.y * 3 || coords.y > bottombar.position.y * 3 + bottombar.size.y * 3)
            )
        ) &&
        (
            audiobar == null
            ||
            (
                (coords.x < audiobar.position.x * 3 || coords.x > audiobar.position.x * 3 + audiobar.size.x * 3)
                ||
                (coords.y < audiobar.position.y * 3 || coords.y > audiobar.position.y * 3 + audiobar.size.y * 3)
            )
        );
    //printd("[AUDIO] analyze touch at coords " + JSON.stringify(coords)+ " was valid " + isValid);
    return isValid;
}

function touchBegin(event) {
    var coords = { x: event.x, y: event.y };
	swipingUp = false;
    swipingDown = false;
    swipingLeft = false;
    swipingRight = false;
	touchInProgress = true;
    swipeLastTouchY = 0;
    swipeLastTouchX = 0;
    initialTouchY = 0;
    initialTouchX = 0;
    if ((!bottombar || !bottombar.isVisible()) && !connections.isVisible() && coords.y > SCREEN_HEIGHT - BOTTOM_ZONE_HEIGHT) {
        // possible swipe up started
        swipingUp = true;
        initialTouchY = coords.y;
        swipeLastTouchY = coords.y;
        printd("Swipe up started");
    } else if (bottombar && bottombar.isVisible() && !connections.isVisible() && coords.y > SCREEN_HEIGHT - 300) {
        // possible swipe down started
        swipingDown = true;
        initialTouchY = coords.y;
        swipeLastTouchY = coords.y;
        printd("Swipe down started");
    }


    if (!swipingDown && !swipingUp) {
        if (!connections.isVisible() && coords.x > SCREEN_WIDTH - RIGHT_ZONE_WIDTH) {
            swipingLeft = true;
            initialTouchX = coords.x;
            swipeLastTouchX = coords.x;
            printd("Swipe left started");
        } else if(connections.isVisible() && coords.x > SCREEN_WIDTH - (connections.width() * 3)) {
            swipingRight = true;
            initialTouchX = coords.x;
            swipeLastTouchX = coords.x;
            printd("Swipe right started");
        }

    }

}


function touchEnd(event) {
    var coords = { x: event.x, y: event.y };
    if (swipingUp && swipeLastTouchX < initialTouchY - MIN_SWIPE_VERT) {
        raiseBottomBar();
    	printd("Swipe Up finished!");
    } else if (swipingDown && swipeLastTouchY > initialTouchY + MIN_SWIPE_VERT) {
        lowerBottomBar();
        printd("Swipe Down finished!");
    } else if (swipingLeft && !connections.isVisible() && swipeLastTouchX < initialTouchX - MIN_SWIPE_HORIZ) {
        showConnections();
        printd("Swipe Left finished!");
    } else if (swipingRight && connections.isVisible() && swipeLastTouchX > initialTouchX + MIN_SWIPE_HORIZ) {
        hideConnections();
        printd("Swipe Right finished!");
    }
    touchInProgress=false;
    swipeLastTouchY = 0;
}

var bottombar;
function raiseBottomBar() {
    if (bottombar) {
        bottombar.setVisible(true);
        return;
    }

    bottombar = new QmlFragment({
        menuId: "hifi/android/bottombar"
    });
    bottombar.setVisible(true);
    bottombar.raise();
    var avatarBtn = bottombar.addButton({
        icon: "icons/android/avatar-i.svg",
        activeIcon: "icons/android/avatar-a.svg",
        text: "AVATAR",
    });
    avatarBtn.clicked.connect(function() {
        printd("Avatar button clicked");
    }); // god view button
    
    var gotoBtn = bottombar.addButton({
        icon: "icons/android/goto-i.svg",
        activeIcon: "icons/android/goto-a.svg",
        text: "GO TO",
    });
    gotoBtn.clicked.connect(function() {
        printd("Goto clicked");
        DialogsManager.toggleAddressBar();
    });
    var bubbleBtn = bottombar.addButton({
        icon: "icons/android/bubble-i.svg",
        activeIcon: "icons/android/bubble-a.svg",
        text: "BUBBLE",
    });
    bubbleBtn.clicked.connect(function() {
        printd("Bubble clicked");
        Users.toggleIgnoreRadius();
        bubbleBtn.editProperties({isActive: Users.getIgnoreRadiusEnabled()});
    });

    var chatBtn = bottombar.addButton({
        icon: "icons/android/chat-i.svg",
        activeIcon: "icons/android/chat-a.svg",
        text: "CHAT",
    });
    chatBtn.clicked.connect(function() {
        printd("Chat clicked");
    });

    var peopleBtn = bottombar.addButton({
        icon: "icons/android/people-i.svg",
        activeIcon: "icons/android/people-a.svg",
        text: "PEOPLE",
    });
    peopleBtn.clicked.connect(function() {
        printd("People clicked");
        if (!connections.isVisible()) {
            showConnections();
        } else {
            hideConnections();
        }
        peopleBtn.editProperties({isActive: connections.isVisible()});
    });

    var settingsBtn = bottombar.addButton({
        icon: "icons/android/settings-i.svg",
        activeIcon: "icons/android/settings-a.svg",
        text: "SETTINGS",
    });
    settingsBtn.clicked.connect(function() {
        printd("Settings clicked");
    });

    bottombar.setVisible(true);
    bottombar.raise();
}

function lowerBottomBar() {
    if (bottombar) {
        printd("[MENU] hiding bottom bar");
        bottombar.setVisible(false);
        //bottombar = null;
    }
}

function touchUpdate(event) {
	var coords = { x: event.x, y: event.y };
	if (touchInProgress) {
        if(swipingUp && coords.y < swipeLastTouchY) {
            printd("[MENU] touch update swipingUp (ini:" + initialTouchY + ")" + swipeLastTouchY);
            swipingDown = false;
            swipeLastTouchY = coords.y;
        } else if (swipingDown && coords.y > swipeLastTouchY) {
            swipingUp = false;
            swipeLastTouchY = coords.y;
            printd("[MENU] touch update swipingDown (ini:" + initialTouchY + ")" + swipeLastTouchY);
        } else if (swipingLeft && coords.x < swipeLastTouchX) {
            swipingRight = false;
            swipeLastTouchX = coords.x;
            printd("[MENU] touch update swipingLeft (ini:" + initialTouchX + ")" + swipeLastTouchX);
        } else if (swipingRight && coords.x > swipeLastTouchX) {
            swipingLeft = false;
            swipeLastTouchX = coords.x;
            printd("[MENU] touch update swipingRight (ini:" + initialTouchX + ")" + swipeLastTouchX);
    	} else {
            touchInProgress = false; // or invalidateSwipingUp=true;
        }
    }
}

function showConnections() {
    connections.show();    
//    printd("[CONNECTIONS] showing");
}

function hideConnections() {
    connections.hide();
    //connections.destroy();
//    printd("[CONNECTIONS] hiding");
}

var setupModesBar = function() {

    var modesBar = new QmlFragment({
        menuId: "hifi/android/modesbar"
    });
    var vrBtn = modesBar.addButton({
        icon: "icons/android/vr-i.svg",
        activeIcon: "icons/android/vr-a.svg",
        bgOpacity: 0.1,
        text: "VR"/*,
        textColor: "#b2b2b2",
        hoverTextColor: "#b2b2b2",
        activeTextColor: "#b2b2b2",
        activeHoverTextColor: "#b2b2b2"*/
    });
    var buttonGodViewMode = modesBar.addButton({
        icon: "icons/android/radar-i.svg",
        activeIcon: "icons/android/radar-a.svg",
        bgOpacity: 0.1,
        text: "RADAR"/*,
        textColor: "#b2b2b2",
        hoverTextColor: "#b2b2b2",
        activeTextColor: "#b2b2b2",
        activeHoverTextColor: "#b2b2b2"*/
    });
    var buttonMyViewMode = modesBar.addButton({
        icon: "icons/android/myview-i.svg",
        activeIcon: "icons/android/myview-a.svg",
        bgOpacity: 0.1,
        text: "MY VIEW"/*,
        textColor: "#b2b2b2",
        hoverTextColor: "#b2b2b2",
        activeTextColor: "#b2b2b2",
        activeHoverTextColor: "#b2b2b2"*/
    });

    var modesButtons = [vrBtn, buttonGodViewMode, buttonMyViewMode];

    // FIRST PRESELECTED IS GODVIEW (RADAR)

    var currentSelected = buttonGodViewMode;
    var buttonsRevealed = false;
    buttonGodViewMode.isActive = true;

    function showAllButtons() {
        for (var i=0; i<modesButtons.length; i++) {
            modesButtons[i].visible = true;
        }
        buttonsRevealed = true;
    }

    function hideAllButtons() {
        for (var i=0; i<modesButtons.length; i++) {
            modesButtons[i].visible = false;
        }
    }

    function hideOtherButtons(thisButton) {
        printd("Hiding all but " + thisButton);
        for (var i=0; i<modesButtons.length; i++) {
            if (modesButtons[i] != thisButton) {
                printd("----Hiding " + thisButton);
                modesButtons[i].visible = false;
            } else {
                // be sure to keep it visible
                modesButtons[i].visible = true;
            }
        }
        buttonsRevealed = false;
    }

    function switchModeButtons(clickedButton, hideAllAfter) {
        currentSelected.isActive = false;
        currentSelected = clickedButton;
        clickedButton.isActive = true;
        if (hideAllAfter) {
            hideAllButtons();
        } else {
            hideOtherButtons(clickedButton);
        }
    }

    function onButtonClicked(clickedButton, whatToDo, hideAllAfter) {
        if (currentSelected == clickedButton) {
            if (buttonsRevealed) {
                hideOtherButtons(clickedButton);
            } else {
                showAllButtons();
            }
        } else {
            // mode change
            whatToDo();
            switchModeButtons(clickedButton, hideAllAfter);
        }
    }

    vrBtn.clicked.connect(function() {
        if (connections.isVisible()) return;

        printd("VR clicked");
        onButtonClicked(vrBtn, function() {
            var isDesktop = Menu.isOptionChecked("Android");
            Menu.setIsOptionChecked(isDesktop ? "Daydream" : "Android", true);
            lowerBottomBar();
        }, true);
    });
    buttonGodViewMode.clicked.connect(function() {
        if (connections.isVisible()) return;

        printd("Radar clicked");
        onButtonClicked(buttonGodViewMode, function() {
            GODVIEWMODE.startGodViewMode();
        });
    });
    buttonMyViewMode.clicked.connect(function() {
        if (connections.isVisible()) return;

        printd("My View clicked");
        onButtonClicked(buttonMyViewMode, function() {
            GODVIEWMODE.endGodViewMode();
        });
    });

    hideOtherButtons(buttonGodViewMode);
    GODVIEWMODE.startGodViewMode();

    return {
        restoreMyViewButton: function() {
            switchModeButtons(buttonMyViewMode);
        },
        qmlFragment: modesBar
    };

};

function onMuteToggled() {
    Menu.setIsOptionChecked("Mute Microphone", !Menu.isOptionChecked("Mute Microphone"));
    updateAudioButtonIcon();
    //printd("[AUDIO] is option Mute Microphone checked " + Menu.isOptionChecked("Mute Microphone"))
}

function updateAudioButtonIcon() {
    audioButton.isActive = Menu.isOptionChecked("Mute Microphone")
}
function setupAudioBar() {
    audiobar = new QmlFragment({
        menuId: "hifi/android/audiobar"
    });

    audioButton = audiobar.addButton({
        icon: "icons/android/mic-unmute-a.svg",
        activeIcon: "icons/android/mic-mute-a.svg",
        text: "",
        bgOpacity: 0.5,
        bgColor: "#FFFFFF"
    });

    updateAudioButtonIcon();

    audioButton.clicked.connect(onMuteToggled);
}

Script.scriptEnding.connect(function () {
	shutdown();
});

init();

}()); // END LOCAL_SCOPE

