import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtQuick.Layouts 1.3

Item {
    id: button
    property string icon: "icons/tablet-icons/edit-i.svg"
    property string text: "EDIT"

    signal clicked()

    width: 100
    height: 100
    Image {
        id: icon
        width: 50
        height: 50
        anchors.bottom: text.top
        anchors.bottomMargin: 5
        anchors.horizontalCenter: parent.horizontalCenter
        fillMode: Image.Stretch
        source: urlHelper(button.icon)
    }
    Text {
        id: text
        color: "#ffffff"
        text: button.text
        font.bold: true
        font.pixelSize: 18
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 10
        anchors.horizontalCenter: parent.horizontalCenter
        horizontalAlignment: Text.AlignHCenter
    }
    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        enabled: true
        onClicked: {
            console.log("Bottom bar button clicked!!");
            /*if (tabletButton.inDebugMode) {
                if (tabletButton.isActive) {
                    tabletButton.isActive = false;
                } else {
                    tabletButton.isActive = true;
                }
            }*/
            button.clicked();
            /*if (tabletRoot) {
                tabletRoot.playButtonClickSound();
            }*/
        }
        /*onEntered: {
            tabletButton.isEntered = true;
            if (tabletButton.isActive) {
                tabletButton.state = "hover active state";
            } else {
                tabletButton.state = "hover state";
            }
        }
        onExited: {
            tabletButton.isEntered = false;
            if (tabletButton.isActive) {
                tabletButton.state = "active state";
            } else {
                tabletButton.state = "base state";
            }
        }*/
    }
}