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
    id: button
    x:0
	Rectangle {
        anchors.fill : parent
 		color: "#9A9A9A"
        Flow {
            id: flowMain
            spacing: 10
            anchors.fill: parent
            anchors.margins: 4
        }
	}

    Component.onCompleted: {
        // put on bottom
        y=Window.innerHeight / 3 - height;
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

    function urlHelper(src) {
            if (src.match(/\bhttp/)) {
                return src;
            } else {
                return "../../../" + src;
            }
        }

}
