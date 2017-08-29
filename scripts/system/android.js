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


var logEnabled = true;
var mode="my view";
var SCREEN_HEIGHT=Window.innerHeight;
var BOTTOM_ZONE_HEIGHT=50;

var touchInProgress=false;
// vars for swipe up
var swipingUp=false, swUplastTouchY=0;

function printd(str) {
    if (logEnabled)
        print("[android.js] " + str);
}

function init() {
	// temp while I build bottom bar

	Controller.touchBeginEvent.connect(touchBegin);
	Controller.touchEndEvent.connect(touchEnd);
	Controller.touchUpdateEvent.connect(touchUpdate);
}

function shutdown() {
    Controller.touchBeginEvent.disconnect(touchBegin);
    Controller.touchEndEvent.disconnect(touchEnd);
    Controller.touchUpdateEvent.disconnect(touchUpdate);
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
        var bottombar = new MenuBar({
	        menuId: "hifi/android/bottombar"	        
	    });

	    var avatarBtn = bottombar.addButton({
            icon: "icons/android/avatar.svg",
            text: "Avatar",
        });
        avatarBtn.clicked.connect(function() {
        	printd("Avatar button clicked");
        }); // god view button
	    
        var gotoBtn = bottombar.addButton({
            icon: "icons/android/goto.svg",
            text: "Go To",
        });
        gotoBtn.clicked.connect(function() {
			printd("Goto clicked");
        });
        var bubbleBtn = bottombar.addButton({
            icon: "icons/android/bubble.svg",
            text: "Bubble",
        });
        bubbleBtn.clicked.connect(function() {
			printd("Bubble clicked");
        });

        var chatBtn = bottombar.addButton({
            icon: "icons/android/chat.svg",
            text: "Chat",
        });
        chatBtn.clicked.connect(function() {
			printd("Chat clicked");
        });

        var peopleBtn = bottombar.addButton({
            icon: "icons/android/people.svg",
            text: "People",
        });
        peopleBtn.clicked.connect(function() {
			printd("People clicked");
        });

        var settingsBtn = bottombar.addButton({
            icon: "icons/android/settings.svg",
            text: "Settings",
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

Script.scriptEnding.connect(function () {
	shutdown();
});
printd("Screen: " + Window.innerWidth + "," + Window.innerHeight);
init();
printd("End of local scope");

}()); // END LOCAL_SCOPE

