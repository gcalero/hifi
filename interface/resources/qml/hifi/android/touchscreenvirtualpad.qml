import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtQuick.Layouts 1.3

Item {
	id: virtualpad
	y: 0
	x: 0

	Rectangle {
		id: leftStickBase
		width: 50
		height: 50
		radius: width * 0.5
		color: "#AAAAAA"
		opacity: 0.3
		visible: false
	}

	Rectangle {
		id: leftStick
		width: 125
		height: 125
		radius: width * 0.5
		color: "#888888"
		opacity: 0.5
		visible: false
	}

	function fromScript(message) {
		switch (message.method) {
        case "hideAll":
            leftStickBase.visible = false;
            leftStick.visible = false;
            break;
        case "updatePositions":
        	//console.log('[VPAD] Recognized message:', JSON.stringify(message));
            var data = message.params;
            leftStickBase.x = data.leftStickBaseX/3 - leftStickBase.width/2;
            leftStickBase.y = data.leftStickBaseY/3 - leftStickBase.height/2;
            leftStick.x = data.leftStickX/3 - leftStick.width/2;
            leftStick.y = data.leftStickY/3 - leftStick.height/2;
            leftStickBase.visible = true;
            leftStick.visible = true;
            break;
        
        default:
            //console.log('[VPAD] Unrecognized message:', JSON.stringify(message));
        }
	}
}