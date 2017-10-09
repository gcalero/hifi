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
    y: 0
    width: Window.innerWidth / 3
    height: Window.innerHeight / 3
    id: bar
    property bool isCursorVisible: false  // Override default cursor visibility.
    property bool shown: true

    onShownChanged: {
        bar.visible = shown;
        sendToScript({method: 'shownChanged', params: { shown: shown }});
    }

    function hide() {
        shown = false;
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


    Rectangle {
        id: background
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#4E4E4E"  } // 
            GradientStop { position: 1.0; color: "#242424" } // "#242424"
        }
        anchors.fill: parent
        anchors.margins: 35

        Image {
            id: gotoIcon
            source: "../icons/android/goto-i.svg"
            x: 45
            y: 50
            width: 55
            height: 55
        }

        HifiStyles.FiraSansRegular {
            x: 120
            anchors.verticalCenter: gotoIcon.verticalCenter
            text: "GO TO"
            color: "#FFFFFF"
        }

        Rectangle {
            id: hideButton
            height: 50
            width: 50
            color: "#00000000"
            anchors {
                top: gotoIcon.top
                right: parent.right
                rightMargin: 43
            }
            Image {
                id: hideIcon
                source: "../icons/android/hide.svg"
                anchors {
                    right: parent.right
                    horizontalCenter: parent.horizontalCenter
                }
            }
            HifiStyles.FiraSansRegular {
                anchors {
                    top: hideIcon.bottom
                    horizontalCenter: hideIcon.horizontalCenter
                    topMargin: 12
                }
                text: "HIDE"
                color: "#FFFFFF"
                font.pixelSize: hifi.fonts.pixelSize * 0.75;
            }
        
            MouseArea {
                anchors.fill: parent
                onClicked: {
                    hide();
                }
            }
        }


        HifiStyles.RalewayRegular {
            id: notice
            text: "YOUR LOCATION"
            font.pixelSize: hifi.fonts.pixelSize * 0.75;
            color: "#2CD7FF"
            anchors {
                bottom: addressBackground.top
                bottomMargin: 15
                left: addressBackground.left
                leftMargin: 20
            }

        }

        property int inputAreaHeight: 70
        property int inputAreaStep: (height - inputAreaHeight) / 2

        ToolbarButton {
            id: homeButton
            y: 150
            imageURL: "../icons/android/home.svg"
            onClicked: {
                addressBarDialog.loadHome();
                bar.shown = false;
            }
            anchors {
                horizontalCenter: gotoIcon.horizontalCenter
            }
        }

        ToolbarButton {
            id: backArrow;
            imageURL: "../icons/android/backward.svg";
            onClicked: addressBarDialog.loadBack();
            anchors {
                left: homeButton.right
                leftMargin: 20
                verticalCenter: homeButton.verticalCenter
            }
        }
        ToolbarButton {
            id: forwardArrow;
            imageURL: "../icons/android/forward.svg";
            onClicked: addressBarDialog.loadForward();
            anchors {
                left: backArrow.right
                leftMargin: 20
                verticalCenter: homeButton.verticalCenter
            }
        }

        HifiStyles.FiraSansRegular {
            id: location;
            font.pixelSize: addressLine.font.pixelSize;
            color: "gray";
            clip: true;
            anchors.fill: addressLine;
            visible: addressLine.text.length === 0
            z: 1
        }

        Rectangle {
            id: addressBackground
            x: 260
            y: 150
            width: 480
            height: 50
            color: "#FFFFFF"
        }

        TextInput {
            id: addressLine
            focus: true
            x: 290
            y: 150
            width: 450
            height: 40
            inputMethodHints: Qt.ImhNoPredictiveText
            //helperText: "Hint is here"
            anchors {
                verticalCenter: homeButton.verticalCenter                
            }
            font.pixelSize: hifi.fonts.pixelSize * 1.25
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
        }
        


        function toggleOrGo() {
            if (addressLine.text !== "") {
                addressBarDialog.loadAddress(addressLine.text);
            }
            bar.shown = false;
        }

        Keys.onPressed: {
            switch (event.key) {
                case Qt.Key_Escape:
                case Qt.Key_Back:
                    clearAddressLineTimer.start();
                    event.accepted = true
                    bar.shown = false;
                    break
                case Qt.Key_Enter:
                case Qt.Key_Return:
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
            notice.color = "#ffffff"; // hifiStyleConstants.colors.baseGrayHighlight;
            location.visible = false;
        } else {
            notice.text = AddressManager.isConnected ? "YOUR LOCATION:" : "NOT CONNECTED";
            notice.color = AddressManager.isConnected ? hifiStyleConstants.colors.turquoise : hifiStyleConstants.colors.redHighlight;
            // Display hostname, which includes ip address, localhost, and other non-placenames.
            location.text = (AddressManager.placename || AddressManager.hostname || '') + (AddressManager.pathname ? AddressManager.pathname.match(/\/[^\/]+/)[0] : '');
            location.visible = true;
        }
    }

}