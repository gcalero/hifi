//
//  AddressBarDialog.qml
//
//  Created by Austin Davis on 2015/04/14
//  Copyright 2015 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import Hifi 1.0
import QtQuick 2.4
import "controls"
import "styles"
import "hifi"
import "hifi/toolbars"
import "styles-uit" as HifiStyles
import "controls-uit" as HifiControls
Item {
    x: 0
    y: 75
    width: 853
    height: 100
    id: root
    property bool isCursorVisible: false  // Override default cursor visibility.
    property bool shown: true

    onShownChanged: {
        root.visible = shown;
        sendToScript({method: 'shownChanged', params: { shown: shown }});
    }

    Component.onCompleted: {
        updateLocationText(false);
    }

    HifiConstants { id: hifi }
    HifiStyles.HifiConstants { id: hifiStyleConstants }

    signal sendToScript(var message);

    AddressBarDialog {
        id: addressBarDialog
    }

    Image {
        id: backgroundImage
        source: "../images/address-bar-856.svg"
        width: 856
        height: 100
        y: 0
        x: 0
        property int inputAreaHeight: 70
        property int inputAreaStep: (height - inputAreaHeight) / 2

        ToolbarButton {
            id: homeButton
            imageURL: "../images/home.svg"
            onClicked: {
                addressBarDialog.loadHome();
                root.shown = false;
            }
            anchors {
                left: parent.left
                leftMargin: homeButton.width / 2
                verticalCenter: parent.verticalCenter
            }
        }

        ToolbarButton {
            id: backArrow;
            imageURL: "../images/backward.svg";
            onClicked: addressBarDialog.loadBack();
            anchors {
                left: homeButton.right
                verticalCenter: parent.verticalCenter
            }
        }
        ToolbarButton {
            id: forwardArrow;
            imageURL: "../images/forward.svg";
            onClicked: addressBarDialog.loadForward();
            anchors {
                left: backArrow.right
                verticalCenter: parent.verticalCenter
            }
        }

        HifiStyles.RalewayLight {
            id: notice;
            font.pixelSize: hifi.fonts.pixelSize * 0.50;
            anchors {
                top: parent.top
                topMargin: parent.inputAreaStep + 12
                left: addressLine.left
                right: addressLine.right
            }
        }
        HifiStyles.FiraSansRegular {
            id: location;
            font.pixelSize: addressLine.font.pixelSize;
            color: "gray";
            clip: true;
            anchors.fill: addressLine;
            visible: addressLine.text.length === 0
        }
        TextInput {
            id: addressLine
            focus: true
            inputMethodHints: Qt.ImhNoPredictiveText
            anchors {
                top: parent.top
                bottom: parent.bottom
                left: forwardArrow.right
                right: parent.right
                leftMargin: forwardArrow.width
                rightMargin: forwardArrow.width / 2
                topMargin: parent.inputAreaStep + (2 * hifi.layout.spacing)
                bottomMargin: parent.inputAreaStep
            }
            font.pixelSize: hifi.fonts.pixelSize * 0.75
            onTextChanged: {
                //filterChoicesByText();
                updateLocationText(addressLine.text.length > 0);
                if (!isCursorVisible && text.length > 0) {
                    isCursorVisible = true;
                    cursorVisible = true;
                }
            }
            onActiveFocusChanged: {
                //cursorVisible = isCursorVisible && focus;
            }
            /*MouseArea {
                // If user clicks in address bar show cursor to indicate ability to enter address.
                anchors.fill: parent
                onClicked: {
                    isCursorVisible = true;
                    parent.cursorVisible = true;
                    parent.forceActiveFocus();
                }
            }*/
        }

        function toggleOrGo() {
            if (addressLine.text !== "") {
                addressBarDialog.loadAddress(addressLine.text);
            }
            root.shown = false;
        }

        Keys.onPressed: {
            switch (event.key) {
                case Qt.Key_Escape:
                case Qt.Key_Back:
                    console.log("[goto-android] BACK WAS PRESSED!!!");
                    clearAddressLineTimer.start();
                    event.accepted = true
                    root.shown = false;
                    break
                case Qt.Key_Enter:
                case Qt.Key_Return:
                    console.log("[goto-android] RETURN WAS PRESSED!!!");
                    toggleOrGo();
                    clearAddressLineTimer.start();
                    event.accepted = true
                    break
            }
        }

    }

    Timer {
        // Delay clearing address line so as to avoid flicker of "not connected" being displayed after entering an address.
        id: clearAddressLineTimer
        running: false
        interval: 100  // ms
        repeat: false
        onTriggered: {
            addressLine.text = "";
            isCursorVisible = false;
        }
    }
    function updateLocationText(enteringAddress) {
        if (enteringAddress) {
            notice.text = "Go to a place, @user, path or network address";
            notice.color = hifiStyleConstants.colors.baseGrayHighlight;
            location.visible = false;
        } else {
            notice.text = AddressManager.isConnected ? "Your location:" : "Not Connected";
            notice.color = AddressManager.isConnected ? hifiStyleConstants.colors.baseGrayHighlight : hifiStyleConstants.colors.redHighlight;
            // Display hostname, which includes ip address, localhost, and other non-placenames.
            location.text = (AddressManager.placename || AddressManager.hostname || '') + (AddressManager.pathname ? AddressManager.pathname.match(/\/[^\/]+/)[0] : '');
            location.visible = true;
        }
    }

}