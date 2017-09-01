"use strict";
//
//  hmd.js
//  scripts/system/
//
//  Created by Howard Stearns on 2 Jun 2016
//  Copyright 2016 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
/* globals HMD, Script, Menu, Tablet, Camera */
/* eslint indent: ["error", 4, { "outerIIFEBody": 0 }] */

print("[godView.js] outside scope");

var GODVIEWMODE = {};

function cleanupGodViewModeObject() {
    GODVIEWMODE.startGodViewMode = function () {
        print("[godView.js] start god view mode not implemented");
    }
    GODVIEWMODE.endGodViewMode = function () {
        print("[godView.js] end god view mode not implemented");
    }
    GODVIEWMODE.isTouchValid = function () {
        print("[godView.js] isTouchValid not implemented (considers always valid)");
        return true;
    }
}
cleanupGodViewModeObject();

(function() { // BEGIN LOCAL_SCOPE
//var friends = Script.require('./friends.js');
var logEnabled = true;
function printd(str) {
    if (logEnabled)
        print("[godView.js] " + str);
}

printd("local scope");

var godView = false;
var godViewHeight = 10; // camera position meters above the avatar

var GOD_CAMERA_OFFSET = -1; // 1 meter below the avatar
var ABOVE_GROUND_DROP = 2;
var MOVE_BY = 1;

// Swipe/Drag vars
var PINCH_INCREMENT_FIRST = 0.4; // 0.1 meters zoom in - out
var PINCH_INCREMENT = 0.4; // 0.1 meters zoom in - out
var GOD_VIEW_HEIGHT_MAX_PLUS_AVATAR = 40;
var GOD_VIEW_HEIGHT_MIN_PLUS_AVATAR = 2;
var GOD_VIEW_CAMERA_DISTANCE_TO_ICONS = 0.5; // Icons are near the camera to prevent the LOD manager dismissing them
var GOD_VIEW_ICONS_APPARENT_DISTANCE_TO_AVATAR_BASE = 1; // How much above the avatar base should the icon appear
var lastDragAt;
var lastDeltaDrag;

function moveTo(position) {
    if (godView) {
        MyAvatar.position = position;
        Camera.position = Vec3.sum(MyAvatar.position, {x:0, y: godViewHeight, z: 0});
    }
}

function keyPressEvent(event) {
    if (godView) {
        switch(event.text) {
            case "UP":
                moveTo(Vec3.sum(MyAvatar.position, {x:0.0, y: 0, z: -1 * MOVE_BY}));
                break;
            case "DOWN":
                moveTo(Vec3.sum(MyAvatar.position, {x:0, y: 0, z: MOVE_BY}));
                break;
            case "LEFT":
                moveTo(Vec3.sum(MyAvatar.position, {x:-1 * MOVE_BY, y: 0, z: 0}));
                break;
            case "RIGHT":
                moveTo(Vec3.sum(MyAvatar.position, {x:MOVE_BY, y: 0, z: 0}));
                break;
        }
    }
}

function actionOnObjectFromEvent(event) {
    var rayIntersection = findRayIntersection(Camera.computePickRay(event.x, event.y));
    if (rayIntersection && rayIntersection.intersects && rayIntersection.overlayID) {
        printd("found overlayID touched " + rayIntersection.overlayID);
        if (entitiesByOverlayID[rayIntersection.overlayID]) {
            var entity = Entities.getEntityProperties(entitiesByOverlayID[rayIntersection.overlayID], ["sourceUrl"]); 
            App.openUrl(entity.sourceUrl);
            return true;
        }
    }
    if (rayIntersection && rayIntersection.intersects  && rayIntersection.entityID && rayIntersection.properties) {
        printd("found " + rayIntersection.entityID + " of type " + rayIntersection.properties.type) ;
        if (rayIntersection.properties.type == "Web") {
            printd("found web element to " + rayIntersection.properties.sourceUrl);
            App.openUrl(rayIntersection.properties.sourceUrl);
            return true;
        }
    }
    return false;
}

function moveToFromEvent(event) {
    //printd("-- mousePressOrTouchEnd in godView");
    //printd("-- event.x, event.y:", event.x, ",", event.y);
    var pickRay = Camera.computePickRay(event.x, event.y);

    //printd("-- pr.o:", pickRay.origin.x, ",", pickRay.origin.y, ",", pickRay.origin.z);
    //printd("-- pr.d:", pickRay.direction.x, ",", pickRay.direction.y, ",", pickRay.direction.z);
    //printd("-- c.p:", Camera.position.x, ",", Camera.position.y, ",", Camera.position.z);

    var pointingAt = Vec3.sum(pickRay.origin, Vec3.multiply(pickRay.direction,godViewHeight));

    //printd("-- pointing at:", pointingAt.x, ",", pointingAt.y, ",", pointingAt.z);

    var moveToPosition = { x: pointingAt.x, y: MyAvatar.position.y, z: pointingAt.z };

    //printd("-- moveToPosition:", moveToPosition.x, ",", moveToPosition.y, ",", moveToPosition.z);

    moveTo(moveToPosition);
    return true;
}

function mousePress(event) {
    if (!isTouchValid(coords)) {
        currentTouchIsValid = false;
        return;
    } else {
        currentTouchIsValid = true;
    }
    mousePressOrTouchEnd(event);
}

function mousePressOrTouchEnd(event) {
    if (!currentTouchIsValid) {
        return;
    }
    if (godView) {
        if (actionOnObjectFromEvent(event)) return;
        if (moveToFromEvent(event)) return;
    }
}

function toggleGodViewMode() {
    printd("-- toggleGodViewMode");
    if (godView) {
        endGodView();
    } else {
        startGodView();
    }
}

function fakeDoubleTap() {
    // CLD - temporarily disable toggling mode through double tap
    // * As we have a new UI for toggling between modes, it may be discarded completely in the future.
    // toggleGodViewMode();
}

var currentTouchIsValid = false; // Currently used to know if touch hasn't started on a UI overlay

var DOUBLE_TAP_TIME = 200;
var fakeDoubleTapStart = Date.now();
var touchEndCount = 0;

/* Counts touchEnds and if there were 2 in the DOUBLE_TAP_TIME lapse, it triggers a fakeDoubleTap and returns true.
   Otherwise, returns false (no double tap yet) */
function analyzeDoubleTap() {
    printd("-- touchEndEvent ... touchEndCount:" + touchEndCount);
    var fakeDoubleTapEnd = Date.now();
    printd("-- fakeDoubleTapEnd:" + fakeDoubleTapEnd);
    var elapsed = fakeDoubleTapEnd - fakeDoubleTapStart;
    printd("-- elapsed:" + elapsed);
    if (elapsed > DOUBLE_TAP_TIME) {
        printd("-- elapsed:" + elapsed + " to long for double tap, resetting!");
        touchEndCount = 0;
    }
    
    // if this is our first "up" then record time so we can
    // later determine if second "up" is a double tap
    if (touchEndCount == 0) {
        fakeDoubleTapStart = Date.now();
        printd("-- starting out as a first click... fakeDoubleTapStart:" + fakeDoubleTapStart);
    }
    touchEndCount++;
    
    if (touchEndCount >= 2) {
        var fakeDoubleTapEnd = Date.now();
        printd("-- fakeDoubleTapEnd:" + fakeDoubleTapEnd);
        var elapsed = fakeDoubleTapEnd - fakeDoubleTapStart;
        printd("-- elapsed:" + elapsed);
        if (elapsed <= DOUBLE_TAP_TIME) {
            printd("-- FAKE double tap event!!!  elapsed:" + elapsed);

            touchEndCount = 0;
            fakeDoubleTap();
            return true; // don't do the normal touch end processing
        } else {
            printd("-- too slow.... not a double tap elapsed:" + elapsed);
        }

        touchEndCount = 0;
    }
    return false;
}

function touchEnd(event) {
    // Clean up touch variables
    lastDragAt = null;
    lastDeltaDrag = null;
    touchStartingCoordinates = null; // maybe in special cases it should be setup later?
    startedDraggingCamera = false;
    prevTouchPinchRadius = null;
    draggingCamera = false;

    if (movingCamera) {
        // if camera was indeed moving, we should not further process, it was just dragging
        movingCamera = false;
        return;
    }

    // if pinching or moving is still detected, cancel
    if (event.isPinching) { printd("touchEnd fail because isPinching");return;}
    if (event.isPinchOpening) { printd("touchEnd fail because isPinchingOpening");return;}
    if (event.isMoved) { printd("touchEnd fail because isMoved");return;}

    // if touch is invalid, cancel
    if (!currentTouchIsValid)  { printd("touchEnd fail because !currentTouchIsValid");return;}

    if (analyzeDoubleTap()) return; // double tap detected, finish

    if (godView) {
        mousePressOrTouchEnd(event);
    }
}

/**
* Polyfill for sign(x)
*/
if (!Math.sign) {
  Math.sign = function(x) {
    // If x is NaN, the result is NaN.
    // If x is -0, the result is -0.
    // If x is +0, the result is +0.
    // If x is negative and not -0, the result is -1.
    // If x is positive and not +0, the result is +1.
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
      return Number(x);
    }
    return x > 0 ? 1 : -1;
  };
}

/********************************************************************************************************
 * Line and Plane intersection methods
 ********************************************************************************************************/

/**
* findLinePlaneIntersection
* Given points p {x: y: z:} and q that define a line, and the plane
* of formula ax+by+cz+d = 0, returns the intersection point or null if none.
*/
function findLinePlaneIntersection(p, q, a, b, c, d) {
    return findLinePlaneIntersectionCoords(p.x, p.y, p.z, q.x, q.y, q.z, a, b, c, d);
}

/**
* findLineToHeightIntersection
* Given points p {x: y: z:} and q that define a line, and a planeY
* value that defines a plane paralel to 'the floor' xz plane,
* returns the intersection to that plane or null if none.
*/
function findLineToHeightIntersection(p, q, planeY) {
    return findLinePlaneIntersection(p, q, 0, 1, 0, -planeY);
}

/**
* findLinePlaneIntersectionCoords (to avoid requiring unnecessary instantiation)
* Given points p with px py pz and q that define a line, and the plane
* of formula ax+by+cz+d = 0, returns the intersection point or null if none.
*/
function findLinePlaneIntersectionCoords(px, py, pz, qx, qy, qz, a, b, c, d) {
    var tDenom = a*(qx-px) + b*(qy-py) + c*(qz-pz);
    if (tDenom == 0) return null;

    var t = - ( a*px + b*py + c*pz + d ) / tDenom;

    return {
        x: (px+t*(qx-px)),
        y: (py+t*(qy-py)),
        z: (pz+t*(qz-pz))
    };
}

/**
* findLineToHeightIntersection
* Given points p with px py pz and q that define a line, and a planeY
* value that defines a plane paralel to 'the floor' xz plane,
* returns the intersection to that plane or null if none.
*/
function findLineToHeightIntersectionCoords(px, py, pz, qx, qy, qz, planeY) {
    return findLinePlaneIntersectionCoords(px, py, pz, qx, qy, qz, 0, 1, 0, -planeY);
}

function findRayIntersection(pickRay) {
    // Check 3D overlays and entities. Argument is an object with origin and direction.
    /* TMP
      bool intersects;
    OverlayID overlayID;
    float distance;
    BoxFace face;
    glm::vec3 surfaceNormal;
    glm::vec3 intersection;
    QString extraInfo;
    */
    var result = Overlays.findRayIntersection(pickRay);
    if (!result.intersects) {
        result = Entities.findRayIntersection(pickRay, true);
    }
    return result;
}

/********************************************************************************************************
 * 
 ********************************************************************************************************/

function isTouchValid(coords) {
    // TODO: Extend to the detection of touches on new menu bars
    return !tablet.getItemAtPoint(coords) && GODVIEWMODE.isTouchValid(coords);
}

/********************************************************************************************************
 * 
 ********************************************************************************************************/

var touchStartingCoordinates = null;

function touchBegin(event) {
    var coords = { x: event.x, y: event.y };
    if (!isTouchValid(coords) ) {
        printd("analyze touch - GOD_VIEW_TOUCH - INVALID");
        currentTouchIsValid = false;
        touchStartingCoordinates = null;
    } else {
        printd("analyze touch - GOD_VIEW_TOUCH - ok");
        currentTouchIsValid = true;
        touchStartingCoordinates = coords;
    }
}

var startedDraggingCamera = false; // first time
var draggingCamera = false; // is trying
var movingCamera = false; // definitive

var MIN_DRAG_DISTANCE_TO_CONSIDER = 100; // distance by axis, not real distance

var prevTouchPinchRadius = null;

function pinchUpdate(event) {
    //printd("touchUpdate HERE - " + "isPinching");
    if (!event.isMoved) return;
    if (event.radius <= 0) return;

    // pinch management
    var avatarY = MyAvatar.position.y;
    var pinchIncrement;
    if (!!prevTouchPinchRadius) {
        // no prev value
        pinchIncrement = PINCH_INCREMENT * Math.abs(event.radius - prevTouchPinchRadius) * 0.1;
    } else {
        pinchIncrement = PINCH_INCREMENT_FIRST;
    }

    if (event.isPinching) {
        if (godViewHeight + pinchIncrement > GOD_VIEW_HEIGHT_MAX_PLUS_AVATAR + avatarY) {
            godViewHeight = GOD_VIEW_HEIGHT_MAX_PLUS_AVATAR + avatarY;
        } else {
            godViewHeight += pinchIncrement;
        }
    } else if (event.isPinchOpening) {
        if (godViewHeight - pinchIncrement < GOD_VIEW_HEIGHT_MIN_PLUS_AVATAR + avatarY) {
            godViewHeight = GOD_VIEW_HEIGHT_MIN_PLUS_AVATAR + avatarY;
        } else {
            godViewHeight -= pinchIncrement;
        }
    }
    var deltaHeight = avatarY + godViewHeight - Camera.position.y;
    //printd("pinch test: pinchIncrement: " + pinchIncrement + " deltaHeight: " + deltaHeight );
    //printd("pinch test:        radius prevRadius: " + prevTouchPinchRadius + " currRadius: " + event.radius);
    Camera.position = Vec3.sum(Camera.position, {x:0, y: deltaHeight, z: 0});
    if (!draggingCamera) {
        startedDraggingCamera = true;
        draggingCamera = true;
    }

    prevTouchPinchRadius = event.radius;
}

function dragScrollUpdate(event) {
    if (!event.isMoved) return;

    // drag management
    printd("touchUpdate HERE - " + "isMoved --------------------");
    //event.x
    var pickRay = Camera.computePickRay(event.x, event.y);
    var dragAt = Vec3.sum(pickRay.origin, Vec3.multiply(pickRay.direction, godViewHeight));

    //printd("touchUpdate HERE - " + " pickRay.direction " + JSON.stringify(pickRay.direction));

    if (lastDragAt === undefined || lastDragAt === null) {
        lastDragAt = dragAt;
        return;
    }

    printd("touchUpdate HERE - " + " event " + event.x + " x " + event.y);
    //printd("touchUpdate HERE - " + " lastDragAt " + JSON.stringify(lastDragAt));
    //printd("touchUpdate HERE - " + " dragAt " + JSON.stringify(dragAt));

    var deltaDrag = {x: (lastDragAt.x - dragAt.x), y: 0, z: (lastDragAt.z-dragAt.z)};

    lastDragAt = dragAt;
    if (lastDeltaDrag === undefined || lastDeltaDrag === null) {
        lastDeltaDrag = deltaDrag;
        return;
    }

    if (!draggingCamera) {
        startedDraggingCamera = true;
        draggingCamera = true;
    } else {
        if (!movingCamera) {
            if (Math.abs(touchStartingCoordinates.x-event.x) > MIN_DRAG_DISTANCE_TO_CONSIDER
                || Math.abs(touchStartingCoordinates.y-event.y) > MIN_DRAG_DISTANCE_TO_CONSIDER) {
                movingCamera = true;
            }
        }
        if (movingCamera) {
            if (Math.sign(deltaDrag.x) == Math.sign(lastDeltaDrag.x) && Math.sign(deltaDrag.z) == Math.sign(lastDeltaDrag.z)) {
                // Process movement if direction of the movement is the same than the previous frame
                // process delta
                var moveCameraTo = Vec3.sum(Camera.position, deltaDrag);
                printd("touchUpdate HERE - " + " x diff " + (lastDragAt.x - dragAt.x));
                //printd("touchUpdate HERE - " + " moveCameraFrom " + JSON.stringify(Camera.position));
                //printd("touchUpdate HERE - " + " moveCameraTo " + JSON.stringify(moveCameraTo));
                // move camera
                Camera.position = moveCameraTo;
            } else {
                // Do not move camera if it's changing direction in this case, wait until the next direction confirmation..
            }
            lastDeltaDrag = deltaDrag; // save last
        }
    }
}

function touchUpdate(event) {
    if (!currentTouchIsValid) {
        // avoid moving and zooming when tap is over UI entities
        return;
    }
    if (event.isPinching || event.isPinchOpening) {
        pinchUpdate(event);
    } else {
        dragScrollUpdate(event);
    }
}

/********************************************************************************************************
 * Avatar cache structure for showing avatars markers
 ********************************************************************************************************/

// by QUuid
var avatarsData = {};
var avatarsIcons = []; // a parallel list of icons (overlays) to easily run through

var ICON_MY_AVATAR_MODEL_URL = Script.resolvePath("assets/models/teleport-destination.fbx"); // FIXME - use correct model&texture
var ICON_AVATAR_MODEL_URL = Script.resolvePath("assets/models/teleport-cancel.fbx"); // FIXME - use correct model&texture
var ICON_AVATAR_DEFAULT_DIMENSIONS = {
    x: 0.10,
    y: 0.00001,
    z: 0.10
};

var avatarIconModelDimensionsVal = { x: 0, y: 0.00001, z: 0};
function avatarIconModelDimensions() {
    // given the current height, give a size
    var xz = -0.002831 * godViewHeight + 0.1;
    avatarIconModelDimensionsVal.x = xz;
    avatarIconModelDimensionsVal.z = xz;
    // reuse object
    return avatarIconModelDimensionsVal;
}

function currentOverlayForAvatar(QUuid) {
    if (avatarsData[QUuid] != undefined) {
        return avatarsData[QUuid].icon;
    } else {
        return null;
    }
}

function saveAvatarData(QUuid) {
    if (QUuid == null) return;
    var avat = AvatarList.getAvatar(QUuid);
    printd("avatar added save avatar " + QUuid);
    if (avatarsData[QUuid] != undefined) {
        avatarsData[QUuid].position = avat.position;
    } else {
        var avatarIcon = Overlays.addOverlay("model", {
            url: ICON_AVATAR_MODEL_URL,
            dimensions: ICON_AVATAR_DEFAULT_DIMENSIONS,
            visible: false
        });
        avatarsIcons.push(avatarIcon);
        avatarsData[QUuid] = { position: avat.position, icon: avatarIcon};
        //printd("avatar added save avatar DONE " + JSON.stringify(avatarsData[QUuid]));
    }
}

function removeAvatarData(QUuid) {
    if (QUuid == null) return;

    var itsOverlay =  currentOverlayForAvatar(QUuid);
    if (itsOverlay != null) {
        Overlays.deleteOverlay(itsOverlay);
    }
    var idx = avatarsIcons.indexOf(itsOverlay);
    avatarsIcons.splice(idx, 1);

    delete avatarsData[QUuid];
}

function saveAllOthersAvatarsData() {
    var avatarIds = AvatarList.getAvatarIdentifiers();
    var len = avatarIds.length;
    for (var i = 0; i < len; i++) {
        if (avatarIds[i]) {
            saveAvatarData(avatarIds[i]);
        }
    }
}


function avatarAdded(QUuid) {
    printd("avatar added " + QUuid);// + " at " + JSON.stringify(AvatarList.getAvatar(QUuid).position));
    saveAvatarData(QUuid);
}

function avatarRemoved(QUuid) {
    printd("avatar removed " + QUuid);
    removeAvatarData(QUuid);
}

/********************************************************************************************************
 * Avatar Icon/Markers rendering
 ********************************************************************************************************/

var myAvatarIcon = Overlays.addOverlay("model", {
    url: ICON_MY_AVATAR_MODEL_URL,
    dimensions: ICON_AVATAR_DEFAULT_DIMENSIONS,
    visible: false
});

function renderMyAvatarIcon() {
    var iconPos = findLineToHeightIntersectionCoords(   MyAvatar.position.x,
                                                        MyAvatar.position.y + GOD_VIEW_ICONS_APPARENT_DISTANCE_TO_AVATAR_BASE,
                                                        MyAvatar.position.z,
                                                        Camera.position.x, Camera.position.y, Camera.position.z,
                                                        Camera.position.y - GOD_VIEW_CAMERA_DISTANCE_TO_ICONS);
    if (!iconPos) { printd("avatarmy icon pos null"); return;}
    var iconDimensions = avatarIconModelDimensions();
    //printd("avatarmy icon pos " + JSON.stringify(iconPos));
    Overlays.editOverlay(myAvatarIcon, {
            visible: true,
            dimensions: iconDimensions,
            position: iconPos
    });
}

function hideAllAvatarIcons() {
    var len = avatarsIcons.length;
    for (var i = 0; i < len; i++) {
        Overlays.editOverlay(avatarsIcons[i], {visible: false});
    }
    Overlays.editOverlay(myAvatarIcon, {visible: false})
}

function renderAllOthersAvatarIcons() {
    var avatarPos;
    var iconDimensions = avatarIconModelDimensions();
    for (var QUuid in avatarsData) {
        //printd("avatar icon avatar possible " + QUuid);
        if (avatarsData.hasOwnProperty(QUuid)) {
            if (AvatarList.getAvatar(QUuid) != null) {
                avatarPos = AvatarList.getAvatar(QUuid).position;
                //printd("avatar icon for avatar " + QUuid);
                if (avatarsData[QUuid].icon != undefined) {
                    //printd("avatar icon " + avatarsData[QUuid].icon + " for avatar " + QUuid);
                    var iconPos = findLineToHeightIntersectionCoords(   avatarPos.x, avatarPos.y + GOD_VIEW_ICONS_APPARENT_DISTANCE_TO_AVATAR_BASE, avatarPos.z,
                                                                        Camera.position.x, Camera.position.y, Camera.position.z,
                                                                        Camera.position.y - GOD_VIEW_CAMERA_DISTANCE_TO_ICONS);
                    if (!iconPos) { print ("avatar icon pos bad for " + QUuid); continue; }
                    //printd("avatar icon pos " + QUuid + " pos " + JSON.stringify(iconPos));
                    Overlays.editOverlay(avatarsData[QUuid].icon, {
                        visible: true,
                        dimensions: iconDimensions,
                        position: iconPos
                    });
                }
            }
        }
    }
}

function entityAdded(entityID) {
    printd ("Entity added " + entityID);
    var props = Entities.getEntityProperties(entityID, ["type"]);
    print ("Entity added " + entityID + " PROPS " + JSON.stringify(props));
    if (props && props.type == "Web") {
        print ("Entity Web added " + entityID);
        saveEntityData(entityID);
    }
}

function entityRemoved(entityID) {
    printd ("Entity removed " + entityID);
    var props = Entities.getEntityProperties(entityID, ["type"]);
    if (props && props.type == "Web") {
        print ("Entity Web removed " + entityID);
        removeEntityData(entityID);
    }
}

/********************************************************************************************************
 * Entities (to remark) cache structure for showing entities markers
 ********************************************************************************************************/

var entitiesData = {}; // by entityID
var entitiesByOverlayID = {}; // by overlayID
var entitiesIcons = []; // a parallel list of icons (overlays) to easily run through

var ICON_ENTITY_WEB_MODEL_URL = Script.resolvePath("assets/models/teleport-destination.fbx"); // FIXME - use correct model&texture
var ICON_ENTITY_IMG_MODEL_URL = Script.resolvePath("assets/models/teleport-cancel.fbx"); // FIXME - use correct model&texture
var ICON_ENTITY_DEFAULT_DIMENSIONS = {
    x: 0.10,
    y: 0.00001,
    z: 0.10
};

var entityIconModelDimensionsVal = { x: 0, y: 0.00001, z: 0};
function entityIconModelDimensions() {
    // given the current height, give a size
    var xz = -0.002831 * godViewHeight + 0.1;
    entityIconModelDimensionsVal.x = xz;
    entityIconModelDimensionsVal.z = xz;
    // reuse object
    return entityIconModelDimensionsVal;
}

function currentOverlayForEntity(QUuid) {
    if (entitiesData[QUuid] != undefined) {
        return entitiesData[QUuid].icon;
    } else {
        return null;
    }
}

function saveEntityData(QUuid) {
    if (QUuid == null) return;
    var entity = Entities.getEntityProperties(QUuid, ["position"]);
    printd("entity added save entity " + QUuid);
    if (entitiesData[QUuid] != undefined) {
        entitiesData[QUuid].position = entity.position;
    } else {
        var entityIcon = Overlays.addOverlay("model", {
            url: ICON_ENTITY_WEB_MODEL_URL,
            dimensions: ICON_ENTITY_DEFAULT_DIMENSIONS,
            ignoreRayIntersection: false,
            visible: false
        });
        entitiesIcons.push(entityIcon);
        entitiesData[QUuid] = { position: entity.position, icon: entityIcon};
        entitiesByOverlayID[entityIcon] = QUuid;
        //printd("entity added save entity DONE " + JSON.stringify(entitiesData[QUuid]));
    }
}

function removeEntityData(QUuid) {
    if (QUuid == null) return;

    var itsOverlay =  currentOverlayForEntity(QUuid);
    if (itsOverlay != null) {
        Overlays.deleteOverlay(itsOverlay);
        delete entitiesByOverlayID[itsOverlay];
    }
    var idx = entitiesIcons.indexOf(itsOverlay);
    entitiesIcons.splice(idx, 1);

    delete entitiesData[QUuid];
}

/********************************************************************************************************
 * Entities to remark Icon/Markers rendering
 ********************************************************************************************************/

function hideAllEntitiesIcons() {
    var len = entitiesIcons.length;
    for (var i = 0; i < len; i++) {
        Overlays.editOverlay(entitiesIcons[i], {visible: false});
    }
}

function renderAllEntitiesIcons() {
    var entityPos;
    var entityProps;
    var iconDimensions = entityIconModelDimensions();
    for (var QUuid in entitiesData) {
        //printd("entity icon entity possible " + QUuid);
        if (entitiesData.hasOwnProperty(QUuid)) {
            entityProps = Entities.getEntityProperties(QUuid, ["position","visible"]);
            if (entityProps != null) {
                entityPos = entityProps.position;
                //printd("entity icon for entity " + QUuid);
                if (entitiesData[QUuid].icon != undefined) {
                    //printd("entity icon " + entitiesData[QUuid].icon + " for entity " + QUuid);
                    var iconPos = findLineToHeightIntersectionCoords(   entityPos.x, entityPos.y + GOD_VIEW_ICONS_APPARENT_DISTANCE_TO_AVATAR_BASE, entityPos.z,
                                                                        Camera.position.x, Camera.position.y, Camera.position.z,
                                                                        Camera.position.y - GOD_VIEW_CAMERA_DISTANCE_TO_ICONS);
                    if (!iconPos) { print ("entity icon pos bad for " + QUuid); continue; }
                    //printd("entity icon pos " + QUuid + " pos " + JSON.stringify(iconPos));
                    Overlays.editOverlay(entitiesData[QUuid].icon, {
                        visible: entityProps.visible,
                        dimensions: iconDimensions,
                        position: iconPos
                    });
                }
            }
        }
    }
}

/********************************************************************************************************
 * 
 ********************************************************************************************************/

function startGodView() {
    //printd("avatar added list " + JSON.stringify(AvatarList.getAvatarIdentifiers()));
    printd("avatar added my avatar is  " + MyAvatar.sessionUUID);
    saveAllOthersAvatarsData();
    //printd("-- startGodView " + JSON.stringify(avatarsData));
    // Do not move the avatar when going to GodView, only the camera.
    //Camera.mode = "first person";
    //MyAvatar.position = Vec3.sum(MyAvatar.position, {x:0, y: godViewHeight, z: 0});
    Camera.mode = "independent";

    Camera.position = Vec3.sum(MyAvatar.position, {x:0, y: godViewHeight, z: 0});
    Camera.orientation = Quat.fromPitchYawRollDegrees(-90,0,0);
    godView = true;

    connectGodModeEvents();
    //friends.init();
    //friends.show();
}

function endGodView() {
    printd("-- endGodView");
    Camera.mode = "first person";
    godView = false;

    disconnectGodModeEvents();
    //friends.hide();
    //friends.destroy();
}

function onHmdChanged(isHmd) {
    // if we are going to hmd, end god view if it's already on it
    if (isHmd && godView) {
        endGodView();
    }
}

//var buttonMyViewMode;
//var buttonGodViewMode; // buttonRadar ¬¬
var buttonsContainer;
var tablet;
if (!App.isAndroid()) {
    buttonsContainer = Tablet.getTablet("com.highfidelity.interface.tablet.system");
    tablet = buttonsContainer;
} else {
    // TODO Not so much needed?
    buttonsContainer = new QmlFragment({
        menuId: "hifi/android/modesbar"
    });
    tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");
}

function onGodViewModeClicked() {
    startGodView();
}

function onMyViewModeClicked() {
    endGodView();
}

GODVIEWMODE.startGodViewMode = function () {
    startGodView();
};

GODVIEWMODE.endGodViewMode = function () {
    endGodView();
};

module.exports = GODVIEWMODE;

function updateGodView() {
    // Update avatar icons
    if (startedDraggingCamera) {
        hideAllAvatarIcons();
        startedDraggingCamera = false;
    } else if (!draggingCamera) {
        renderMyAvatarIcon();
        renderAllOthersAvatarIcons();
        renderAllEntitiesIcons();
    }
}

function valueIfDefined(value) {
    return value !== undefined ? value : "";
}

function entitiesAnalysis() {
    var ids = Entities.findEntitiesInFrustum(Camera.frustum);
    var entities = [];
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var properties = Entities.getEntityProperties(id);
            entities.push({
                id: id,
                name: properties.name,
                type: properties.type,
                url: properties.type == "Model" ? properties.modelURL : "",
                sourceUrl: properties.sourceUrl,
                locked: properties.locked,
                visible: properties.visible,
                drawCalls: valueIfDefined(properties.renderInfo.drawCalls),
                hasScript: properties.script !== ""
            });
    }
    //printd("ALL ENTITIES: " + JSON.stringify(entities));
}

/*buttonGodViewMode = buttonsContainer.addButton({
    icon: "icons/tablet-icons/goto-i.svg", // FIXME - use correct icon
    text: "Radar"
    //,sortOrder: 2
});

buttonMyViewMode = buttonsContainer.addButton({
    icon: "icons/tablet-icons/switch-desk-i.svg",
    text: "My View",
});*/

function connectGodModeEvents() {
    Script.update.connect(updateGodView); // 60Hz loop
    Controller.keyPressEvent.connect(keyPressEvent);
    Controller.mousePressEvent.connect(mousePress); // single click/touch
    Controller.touchUpdateEvent.connect(touchUpdate);
}

function disconnectGodModeEvents() {
    Script.update.disconnect(updateGodView);
    Controller.keyPressEvent.disconnect(keyPressEvent);
    Controller.mousePressEvent.disconnect(mousePress);
    Controller.touchUpdateEvent.disconnect(touchUpdate);
}

//buttonGodViewMode.clicked.connect(onGodViewModeClicked); // god view button
//buttonMyViewMode.clicked.connect(onMyViewModeClicked); // my view button

Controller.touchBeginEvent.connect(touchBegin);
Controller.touchEndEvent.connect(touchEnd);

AvatarList.avatarAddedEvent.connect(avatarAdded);
AvatarList.avatarRemovedEvent.connect(avatarRemoved);

//LODManager.LODDecreased.connect(function() {printd("LOD DECREASED --");});
//LODManager.LODIncreased.connect(function() {printd("LOD INCREASED ++");});

Entities.addingEntity.connect(entityAdded);
Entities.deletingEntity.connect(entityRemoved);

HMD.displayModeChanged.connect(onHmdChanged);

Script.scriptEnding.connect(function () {
    if (godView) {
        endGodView();
    }
    //buttonGodViewMode.clicked.disconnect(onGodViewModeClicked);
    //buttonMyViewMode.clicked.disconnect(onMyViewModeClicked);
    if (buttonsContainer) {
        //buttonsContainer.removeButton(buttonGodViewMode);
        //buttonsContainer.removeButton(buttonMyViewMode);
    }
    Controller.touchBeginEvent.disconnect(touchBegin);
    Controller.touchEndEvent.disconnect(touchEnd);

    AvatarList.avatarAddedEvent.disconnect(avatarAdded);
    AvatarList.avatarRemovedEvent.disconnect(avatarRemoved);

    //LODManager.LODDecreased.disconnect(function() {printd("LOD DECREASED --");});
    //LODManager.LODIncreased.disconnect(function() {printd("LOD INCREASED ++");});

    Entities.addingEntity.disconnect(entityAdded);
    Entities.deletingEntity.disconnect(entityRemoved);

    HMD.displayModeChanged.disconnect(onHmdChanged);

    // Cleanup GODVIEWMODE object
    cleanupGodViewModeObject();
});

}()); // END LOCAL_SCOPE
