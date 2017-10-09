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

Item {
    id: bar
    x:0

    property bool shown: true

    onShownChanged: {
        bar.visible = shown;
    }

    function hide() {
        shown = false;
    }

    Styles.HifiConstants { id: hifi }

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
            anchors.margins: 4
        }


        Rectangle {
            id: hideButton
            width: 50
            height: 50
            color: "#00000000"
            anchors {
                right: parent.right
                rightMargin: 43
                top: parent.top
                topMargin: 40
            }

            Image {
                id: hideIcon
                source: "../../../icons/android/hide.svg"
                width: 50
                height: 25
                anchors {
                    right: parent.right
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
                font.pixelSize: hifi.fonts.pixelSize;
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
        height = 120;
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
