import QtQuick 2.5

Item {

	id: daydreamWindow

	anchors.centerIn: parent

    width: 600
    height: 450

    property bool shown: true

    onShownChanged: {
        daydreamWindow.visible = shown;
    }

	function urlHelper(src) {
        if (src.match(/\bhttp/) || src.match(/\bfile:/)) {
            return src;
        } else {
            return "../../../" + src;
        }
    }

    Rectangle {
    	id: background
    	color: "black"
    	opacity: 0.9
    	anchors.fill: parent
    }

    Text {
    	id: message
    	width: 500
    	font.pointSize: 8
        anchors.top: parent.top
    	anchors.topMargin: 20
        anchors.horizontalCenter: parent.horizontalCenter
        text: "Press the Daydream button to wake up your controller"
        horizontalAlignment: Text.AlignHCenter
        color: "white"
        wrapMode: Text.WordWrap
    }

    Image {
        id: messageImg
        width: 100
        height: 310
        anchors.top: message.bottom
        anchors.topMargin: 20
        anchors.horizontalCenter: parent.horizontalCenter
        fillMode: Image.PreserveAspectFit
        source: urlHelper("icons/daydream_button.png")
    }

}