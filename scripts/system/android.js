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
var BOTTOM_ZONE_HEIGHT=50;

var touchInProgress=false;
// vars for swipe up
var swipingUp=false, swUplastTouchY=0;

var friends = Script.require('./friends.js');
var isShowingFriends=false;

var modesBar;

function printd(str) {
    if (logEnabled)
        print("[android.js] " + str);
}

function init() {
	// temp while I build bottom bar

	Controller.touchBeginEvent.connect(touchBegin);
	Controller.touchEndEvent.connect(touchEnd);
	Controller.touchUpdateEvent.connect(touchUpdate);

    Script.update.connect(update);

    modesBar = setupModesBar();
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

function touchBegin(event) {
    var coords = { x: event.x, y: event.y };
	swipingUp = false;
	touchInProgress = true;
    if (event.y > SCREEN_HEIGHT - BOTTOM_ZONE_HEIGHT) {
    	swUplastTouchY = event.y;
    }
    printd("touchBegin " + coords.x + "," + coords.y);
}


function touchEnd(event) {
    var coords = { x: event.x, y: event.y };
    touchInProgress=false;
	swUplastTouchY = 0;
    if (swipingUp) {
		//var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");
		//tablet.loadQMLSource("../android/bottombar.qml");
        var bottombar = new QmlFragment({
	        menuId: "hifi/android/bottombar"	        
	    });

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
            if (!isShowingFriends) {
                showFriends();
            } else {
                hideFriends();
            }
            peopleBtn.editProperties({isActive: isShowingFriends});
        });

        var settingsBtn = bottombar.addButton({
            icon: "icons/android/settings-i.svg",
            activeIcon: "icons/android/settings-a.svg",
            text: "SETTINGS",
        });
        settingsBtn.clicked.connect(function() {
			printd("Settings clicked");
        });

	    //friendsWindow.setURL(FRIENDS_WINDOW_URL);
	    bottombar.setVisible(true);
	    bottombar.raise();
	    //bottombar.position.x=500;
	    //bottombar.position.y=1000;
		printd("BottomBar: " + JSON.stringify(bottombar));
	    printd("Parent of bottombar is " + bottombar.parent)
    	printd("Swipe Up finished!");	
    }
}

function touchUpdate(event) {
	var coords = { x: event.x, y: event.y };
	if (touchInProgress && coords.y <= swUplastTouchY) {
		swipingUp = true;
		swUplastTouchY = coords.y;
		printd("Swiping up" + swUplastTouchY);
	} else {
		swipingUp = false;
		touchInProgress = true; // or invalidateSwipingUp=true;
	}
}

function showFriends() {
    friends.init();
    friends.show();
    isShowingFriends=true;
    printd("[FRIENDS] showing");
}

function hideFriends() {
    friends.hide();
    friends.destroy();
    isShowingFriends = false;
    printd("[FRIENDS] hiding");
}

var setupModesBar = function() {

    var modesBar = new QmlFragment({
        menuId: "hifi/android/modesbar"
    });
    var vrBtn = modesBar.addButton({
        icon: "icons/android/vr-i.svg",
        activeIcon: "icons/android/vr-a.svg",
        bgOpacity: 0.1,
        text: "VR"
    });
    var buttonGodViewMode = modesBar.addButton({
        icon: "icons/android/radar-i.svg",
        activeIcon: "icons/android/radar-a.svg",
        bgOpacity: 0.1,
        text: "RADAR"/*,
        sortOrder: 2*/
    });
    var buttonMyViewMode = modesBar.addButton({
        icon: "icons/android/myview-i.svg",
        activeIcon: "icons/android/myview-a.svg",
        bgOpacity: 0.1,
        text: "MY VIEW"
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

    function switchModeButtons(clickedButton) {
        currentSelected.isActive = false;
        currentSelected = clickedButton;
        clickedButton.isActive = true;
        hideOtherButtons(clickedButton);
    }

    function onButtonClicked(clickedButton, whatToDo) {
        if (currentSelected == clickedButton) {
            if (buttonsRevealed) {
                hideOtherButtons(clickedButton);
            } else {
                showAllButtons();
            }
        } else {
            // mode change
            whatToDo();
            switchModeButtons(clickedButton);
        }
    }

    vrBtn.clicked.connect(function() {
        printd("VR clicked");
        onButtonClicked(vrBtn, function() {
            var isDesktop = Menu.isOptionChecked("Android");
            Menu.setIsOptionChecked(isDesktop ? "Daydream" : "Android", true);
        });
    });
    buttonGodViewMode.clicked.connect(function() {
        printd("Radar clicked");
        onButtonClicked(buttonGodViewMode, function() {
            GODVIEWMODE.startGodViewMode();
        });
    });
    buttonMyViewMode.clicked.connect(function() {
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
        }
    };

};

Script.scriptEnding.connect(function () {
	shutdown();
});

init();

}()); // END LOCAL_SCOPE

