import Hifi 1.0
import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtQuick.Layouts 1.3
import Qt.labs.settings 1.0
import "../../styles" as Styles
import "../../styles-uit"
import "../../controls-uit" as HifiControlsUit
import "../../controls" as HifiControls
import ".."
import "."

Item {
    id: bar
    x:0

    property bool shown: true

    signal sendToScript(var message);

    onShownChanged: {
        bar.visible = shown;
    }

    function hide() {
        //shown = false;
        sendToScript({ method: "hide" });
    }

    Styles.HifiConstants { id: hifi }
    HifiAndroidConstants { id: android }

	Rectangle {
        id: background
        anchors.fill : parent
 		color: "#FF000000"
        border.color: "#FFFFFF"
        anchors.bottomMargin: -1
        anchors.leftMargin: -1
        anchors.rightMargin: -1
        Flow {
            id: flowMain
            spacing: 10
            anchors.fill: parent
            anchors.topMargin: 4
            anchors.bottomMargin: 4
            anchors.rightMargin: 4
            anchors.leftMargin: 24
        }


        Rectangle {
            id: hideButton
            height: android.dimen.headerHideWidth
            width: android.dimen.headerHideHeight
            color: "#00000000"
            anchors {
                right: parent.right
                rightMargin: 38
                top: parent.top
                topMargin: 30
            }

            Image {
                id: hideIcon
                source: "../../../icons/android/hide.svg"
                width: android.dimen.headerHideIconWidth
                height: android.dimen.headerHideIconHeight
                anchors {
                    horizontalCenter: parent.horizontalCenter
                    top: parent.top
                }
            }
            FiraSansRegular {
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
	}




    Component.onCompleted: {
        // put on bottom
        width = Window.innerWidth/3;
        height = 85;
        y = Window.innerHeight / 3 - height;
    }
    
    function addButton(properties) {
        var component = Qt.createComponent("button.qml");
        if (component.status == Component.Ready) {
            var button = component.createObject(flowMain);
            // copy all properites to button
            var keys = Object.keys(properties).forEach(function (key) {
                button[key] = properties[key];
            });
            return button;
        } else if( component.status == Component.Error) {
            console.log("Load button errors " + component.errorString());
        }
    }

    function urlHelper(src) {
            if (src.match(/\bhttp/)) {
                return src;
            } else {
                return "../../../" + src;
            }
        }

}
