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
var SETTING_CURRENT_MODE_KEY = 'Android/Mode';
var MODE_VR = "VR", MODE_RADAR = "RADAR", MODE_MY_VIEW = "MY VIEW";
var DEFAULT_MODE = MODE_RADAR;

var logEnabled = false;
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
var touchOnBottom=false;

var connections = Script.require('./connections.js');
var gotoScript = Script.require('./goto-android.js');
var chat = Script.require('./chat.js');
var avatarSelection = Script.require('./avatarSelection.js');
var uniqueColor = Script.require('./libraries/uniqueColor.js');

var modesBar;
var audiobar;
var audioButton;
var peopleBtn;
var gotoBtn;
var chatBtn;
var avatarBtn;
var loginBtn;

function printd(str) {
    if (logEnabled)
        print("[android.js] " + str);
}

function init() {
	// temp while I build bottom bar
    connections.init();
    gotoScript.init();
    chat.init();
    chat.setUniqueColor(uniqueColor);
    GODVIEWMODE.setUniqueColor(uniqueColor);
    GODVIEWMODE.init();
    avatarSelection.init();
    gotoScript.setOnShownChange(function (shown) {
        if (shown) {
            showAddressBar();
        } else {
            hideAddressBar();
        }
    });

	Controller.touchBeginEvent.connect(touchBegin);
	Controller.touchEndEvent.connect(touchEnd);
	Controller.touchUpdateEvent.connect(touchUpdate);

    Script.update.connect(update);

    App.fullAvatarURLChanged.connect(processedNewAvatar);

    modesBar = setupModesBar();

    setupAudioBar();

    GODVIEWMODE.isTouchValid = isGodViewModeValidTouch;
    GODVIEWMODE.setUniqueColor(uniqueColor);

}

function shutdown() {
    Controller.touchBeginEvent.disconnect(touchBegin);
    Controller.touchEndEvent.disconnect(touchEnd);
    Controller.touchUpdateEvent.disconnect(touchUpdate);

    Script.update.disconnect(update);

    App.fullAvatarURLChanged.disconnect(processedNewAvatar);
}

function update() {
    if (HMD.isVrExitRequested()) {
        Menu.setIsOptionChecked("Android", true);
        var isDesktop = Menu.isOptionChecked("Android");
        Controller.setVPadEnabled(true);
        saveCurrentModeSetting(MODE_RADAR);
        //onHmdChanged(!isDesktop);
        HMD.resetVrExitRequested();
        if (modesBar) {
            modesBar.restoreMyViewButton();
        }
    }
}

function isGodViewModeValidTouch(coords) {
    var qmlFragments = [modesBar.qmlFragment, bottombar, audiobar];
    var windows = [connections, gotoScript, chat];
    for (var i=0; i < qmlFragments.length; i++) {
        var aQmlFrag = qmlFragments[i];
        if (aQmlFrag != null &&
            coords.x >= aQmlFrag.position.x * 3 && coords.x <= aQmlFrag.position.x * 3 + aQmlFrag.size.x * 3 &&
            coords.y >= aQmlFrag.position.y * 3 && coords.y <= aQmlFrag.position.y * 3 + aQmlFrag.size.y * 3
           ) {
            return false;
        }
    }

    for (var i=0; i < windows.length; i++) {
        var aWin = windows[i];
        if (aWin != null && aWin.position() != null && 
            coords.x >= aWin.position().x * 3 && coords.x <= aWin.position().x * 3 + aWin.width() * 3 &&
            coords.y >= aWin.position().y * 3 && coords.y <= aWin.position().y * 3 + aWin.height() * 3
        ) {
            return false;
        }
    }
    return true;
}

function touchBegin(event) {
    var coords = { x: event.x, y: event.y };
	swipingUp = false;
    swipingDown = false;
    swipingLeft = false;
    swipingRight = false;
    touchOnBottom = false;
	touchInProgress = true;
    swipeLastTouchY = 0;
    swipeLastTouchX = 0;
    initialTouchY = 0;
    initialTouchX = 0;
    if ((!bottombar || !bottombar.isVisible()) /*&& !connections.isVisible()*/ && coords.y > SCREEN_HEIGHT - BOTTOM_ZONE_HEIGHT) {
        // possible swipe up started
        swipingUp = true;
        initialTouchY = coords.y;
        swipeLastTouchY = coords.y;
        printd("Swipe up started");
    } else if (bottombar && bottombar.isVisible() /*&& !connections.isVisible()*/ && coords.y > SCREEN_HEIGHT - 300) {
        // possible swipe down started
        swipingDown = true;
        initialTouchY = coords.y;
        swipeLastTouchY = coords.y;
        printd("Swipe down started");
    }

    if ((!bottombar || !bottombar.isVisible()) && coords.y > SCREEN_HEIGHT - 300 ) {
        touchOnBottom = true;
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
    if (swipingUp && (swipeLastTouchX == initialTouchY || swipeLastTouchY < initialTouchY - MIN_SWIPE_VERT) ) {
        raiseBottomBar();
    	printd("Swipe Up finished!");
    } else if (swipingDown && (swipeLastTouchX == initialTouchY || swipeLastTouchY > initialTouchY + MIN_SWIPE_VERT)) {
        lowerBottomBar();
        printd("Swipe Down finished!");
    } else if (swipingLeft && !connections.isVisible() && swipeLastTouchX < initialTouchX - MIN_SWIPE_HORIZ) {
        // no action
        printd("Swipe Left finished!");
    } else if (swipingRight && connections.isVisible() && swipeLastTouchX > initialTouchX + MIN_SWIPE_HORIZ) {
        // no action
        printd("Swipe Right finished!");
    } else if (touchOnBottom) {
        if (!bottombar || !bottombar.isVisible()) {
            raiseBottomBar();
            touchOnBottom = false;
        }
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
    avatarBtn = bottombar.addButton({
        icon: "icons/android/avatar-i.svg",
        activeIcon: "icons/android/avatar-a.svg",
        bgOpacity: 0,
        hoverBgOpacity: 0,
        activeBgOpacity: 0,
        activeHoverBgOpacity: 0,
        text: "AVATAR"
    });
    avatarBtn.clicked.connect(function() {
        printd("Avatar button clicked");
        if (!avatarSelection.isVisible()) {
            showAvatarSelection();
        } else {
            hideAvatarSelection();
        }
    });
    avatarSelection.onHidden = function() {
        if (avatarBtn) {
            avatarBtn.isActive = false;
        }
    };
    
    gotoBtn = bottombar.addButton({
        icon: "icons/android/goto-i.svg",
        activeIcon: "icons/android/goto-a.svg",
        bgOpacity: 0,
        hoverBgOpacity: 0,
        activeBgOpacity: 0,
        activeHoverBgOpacity: 0,
        text: "GO TO"
    });
    gotoBtn.clicked.connect(function() {
        //printd("Goto clicked");
        //DialogsManager.toggleAddressBar();
        if (!gotoScript.isVisible()) {
            showAddressBar();
        } else {
            hideAddressBar();
        }
    });
    gotoScript.onHidden = function() {
        if (gotoBtn) {
            gotoBtn.isActive = false;
        }
    };
    
    var bubbleBtn = bottombar.addButton({
        icon: "icons/android/bubble-i.svg",
        activeIcon: "icons/android/bubble-a.svg",
        bgOpacity: 0,
        hoverBgOpacity: 0,
        activeBgOpacity: 0,
        activeHoverBgOpacity: 0,
        text: "BUBBLE"
    });
    bubbleBtn.clicked.connect(function() {
        //printd("Bubble clicked");
        Users.toggleIgnoreRadius();
        bubbleBtn.editProperties({isActive: Users.getIgnoreRadiusEnabled()});
    });

    chatBtn = bottombar.addButton({
        icon: "icons/android/chat-i.svg",
        activeIcon: "icons/android/chat-a.svg",
        bgOpacity: 0,
        hoverBgOpacity: 0,
        activeBgOpacity: 0,
        activeHoverBgOpacity: 0,
        text: "CHAT"
    });
    chatBtn.clicked.connect(function() {
        if (!chat.isVisible()) {
            showChat();
        } else {
            hideChat();
        }

    });

    chat.onHidden = function() {
        if (chatBtn) {
            chatBtn.isActive = false;
        }
    };

    peopleBtn = bottombar.addButton({
        icon: "icons/android/people-i.svg",
        activeIcon: "icons/android/people-a.svg",
        bgOpacity: 0,
        hoverBgOpacity: 0,
        activeBgOpacity: 0,
        activeHoverBgOpacity: 0,
        text: "PEOPLE",
        isActive: connections.isVisible()
    });
    peopleBtn.clicked.connect(function() {
        //printd("People clicked");
        if (!connections.isVisible()) {
            showConnections();
        } else {
            hideConnections();
        }
    });

    loginBtn = bottombar.addButton({
        icon: "icons/android/settings-i.svg",
        activeIcon: "icons/android/settings-a.svg",
        text: Account.isLoggedIn() ? "LOG OUT" : "LOG IN"
    });
    loginBtn.clicked.connect(function() {
        if (!Account.isLoggedIn()) {
            Account.checkAndSignalForAccessToken();
        } else {
            Menu.triggerOption("Login / Sign Up");
        }
    });

    bottombar.setVisible(true);
    bottombar.raise();
}

function lowerBottomBar() {
    if (bottombar) {
        //printd("[MENU] hiding bottom bar");
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
            //touchInProgress = false; // or invalidateSwipingUp=true;
        }
    }
}

function showConnections() {
    connections.show();
    if (peopleBtn) {
        peopleBtn.isActive = true;    
    }
//    printd("[CONNECTIONS] showing");
}

function hideConnections() {
    connections.hide();
    if (peopleBtn) {
        peopleBtn.isActive = false;        
    }
    //connections.destroy();
//    printd("[CONNECTIONS] hiding");
}

function showAddressBar() {
    gotoScript.show();
    gotoBtn.isActive = true;
}

function hideAddressBar() {
    gotoScript.hide();
    gotoBtn.isActive = false;
}

function showChat() {
    chat.show();
    chatBtn.isActive = true;
}

function hideChat() {
    chat.hide();
    chatBtn.isActive = false;
}

function showAvatarSelection() {
    avatarSelection.show();
    avatarBtn.isActive = true;
}
function hideAvatarSelection() {
    avatarSelection.hide();
    avatarBtn.isActive = false;
}

function processedNewAvatar(url, modelName) {
    avatarSelection.refreshSelectedAvatar(url);
    hideAvatarSelection();
}

var setupModesBar = function() {

    var modesBar = new QmlFragment({
        menuId: "hifi/android/modesbar"
    });
    var vrBtn = modesBar.addButton({
        icon: "icons/android/vr-i.svg",
        activeIcon: "icons/android/vr-a.svg",
        bgColor: "#000000",
        bgOpacity: 0.0,
        activeBgOpacity: 0.0,
        text: "VR"/*,
        textColor: "#b2b2b2",
        hoverTextColor: "#b2b2b2",
        activeTextColor: "#b2b2b2",
        activeHoverTextColor: "#b2b2b2"*/
    });
    var buttonGodViewMode = modesBar.addButton({
        icon: "icons/android/radar-i.svg",
        activeIcon: "icons/android/radar-a.svg",
        bgColor: "#000000",
        bgOpacity: 0.0,
        activeBgOpacity: 0.0,
        text: "RADAR"/*,
        textColor: "#b2b2b2",
        hoverTextColor: "#b2b2b2",
        activeTextColor: "#b2b2b2",
        activeHoverTextColor: "#b2b2b2"*/
    });
    var buttonMyViewMode = modesBar.addButton({
        icon: "icons/android/myview-i.svg",
        activeIcon: "icons/android/myview-a.svg",
        bgColor: "#000000",
        bgOpacity: 0.0,
        activeBgOpacity: 0.0,
        text: "MY VIEW"/*,
        textColor: "#b2b2b2",
        hoverTextColor: "#b2b2b2",
        activeTextColor: "#b2b2b2",
        activeHoverTextColor: "#b2b2b2"*/
    });

    var modesButtons = [vrBtn, buttonGodViewMode, buttonMyViewMode];

    var mode = getCurrentModeSetting();
    var currentSelected;

    var buttonsRevealed = false;

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
        if (currentSelected) {
            currentSelected.isActive = false;
        }
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
        saveCurrentModeSetting(MODE_VR);
        Controller.setVPadEnabled(false);
        onButtonClicked(vrBtn, function() {
            var isDesktop = Menu.isOptionChecked("Android");
            Menu.setIsOptionChecked(isDesktop ? "Daydream" : "Android", true);
            lowerBottomBar();
            if (currentSelected == buttonGodViewMode) {
                GODVIEWMODE.endGodViewMode();
            }
        }, true);
    });
    buttonGodViewMode.clicked.connect(function() {
        if (connections.isVisible()) return;
        saveCurrentModeSetting(MODE_RADAR);
        printd("Radar clicked");
        onButtonClicked(buttonGodViewMode, function() {
            GODVIEWMODE.startGodViewMode();
        });
    });
    buttonMyViewMode.clicked.connect(function() {
        if (connections.isVisible()) return;
        saveCurrentModeSetting(MODE_MY_VIEW);
        printd("My View clicked");
        onButtonClicked(buttonMyViewMode, function() {
            if (currentSelected == buttonGodViewMode) {
                GODVIEWMODE.endGodViewMode();
            }
        });
    });

    var savedButton;
    if (mode == MODE_VR) {
        savedButton = vrBtn;
    } else if (mode == MODE_MY_VIEW) {
        savedButton = buttonMyViewMode;
    } else {
        savedButton = buttonGodViewMode;
    }
    printd("[MODE] previous mode " + mode);

//    hideOtherButtons(currentSelected);
    savedButton.clicked();
    return {
        restoreMyViewButton: function() {
            switchModeButtons(buttonMyViewMode);
            saveCurrentModeSetting(MODE_MY_VIEW);
        },
        qmlFragment: modesBar
    };

};

function saveCurrentModeSetting(mode) {
    Settings.setValue(SETTING_CURRENT_MODE_KEY, mode);
}

function getCurrentModeSetting(mode) {
    return Settings.getValue(SETTING_CURRENT_MODE_KEY, DEFAULT_MODE);
}

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
        bgOpacity: 0.0,
        activeBgOpacity: 0.0,
        bgColor: "#FFFFFF"
    });

    updateAudioButtonIcon();

    audioButton.clicked.connect(onMuteToggled);
    GlobalServices.connected.connect(handleLogin);
    GlobalServices.disconnected.connect(handleLogout);
}
function handleLogin() {
    Script.setTimeout(function() {
        if (Account.isLoggedIn()) {
            MyAvatar.displayName=Account.getUsername();
        }
    }, 2000);
    if (loginBtn) {
        loginBtn.editProperties({text: "LOG OUT"});
    }
}
function handleLogout() {
    MyAvatar.displayName="";
    if (loginBtn) {
        loginBtn.editProperties({text: "LOG IN"});
    }
}

Script.scriptEnding.connect(function () {
	shutdown();
    GlobalServices.connected.disconnect(handleLogin);
    GlobalServices.disconnected.disconnect(handleLogout);
});

init();

}()); // END LOCAL_SCOPE

