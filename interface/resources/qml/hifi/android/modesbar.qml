import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtQuick.Layouts 1.3
import Qt.labs.settings 1.0
import "../../styles-uit"
import "../../controls-uit" as HifiControlsUit
import "../../controls" as HifiControls
import ".."

Item {
    id: modesbar
    y:0
	Rectangle {
        anchors.fill : parent
 		color: "transparent"
        Flow {
            id: flowMain
            spacing: 10
            flow: Flow.TopToBottom
            layoutDirection: Flow.TopToBottom
            anchors.fill: parent
            anchors.margins: 4
        }
        /*border.width: 1
        border.color: "red"
        radius: 20*/
	}

    Component.onCompleted: {
        width = 50;
        height = Window.innerHeight/3
        x=Window.innerWidth / 3 - width;
    }
    
    function addButton(properties) {
        var component = Qt.createComponent("button.qml");
        console.log("load button");
        if (component.status == Component.Ready) {
            console.log("load button 2");
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

    function removeButton(name) {
        /*for (var i=0; i < flowMain.children.length; i++) {
            if (flowMain.children[i].objectName === name) {

                break;
            }
        }*/
    }

    function urlHelper(src) {
            if (src.match(/\bhttp/)) {
                return src;
            } else {
                return "../../../" + src;
            }
        }

}
