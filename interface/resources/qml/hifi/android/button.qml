import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtQuick.Layouts 1.3

Item {
    id: button
    property string icon: "icons/tablet-icons/edit-i.svg"
    property string hoverIcon: button.icon
    property string activeIcon: button.icon
    property string activeHoverIcon: button.activeIcon
    property int stableOrder: 0

    property string text: "."
    property string hoverText: button.text
    property string activeText: button.text
    property string activeHoverText: button.activeText
    
    property bool isEntered: false
    property double sortOrder: 100

    property bool isActive: false

    signal clicked()

    onIsActiveChanged: {
        if (button.isEntered) {
            button.state = (button.isActive) ? "hover active state" : "hover state";
        } else {
            button.state = (button.isActive) ? "active state" : "base state";
        }
    }

    function editProperties(props) {
        print ("[MENU] edit properties " + JSON.stringify(props));
        for (var prop in props) {
            button[prop] = props[prop];
        }
    }


    width: 100
    height: 100

    Rectangle {
        id: buttonBg
        color: "#000000"
        opacity: 0.1
        anchors.right: parent.right
        anchors.rightMargin: 0
        anchors.left: parent.left
        anchors.leftMargin: 0
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 0
        anchors.top: parent.top
        anchors.topMargin: 0
    }
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
        onEntered: {
            button.isEntered = true;
            if (button.isActive) {
                button.state = "hover active state";
            } else {
                button.state = "hover state";
            }
        }
        onExited: {
            button.isEntered = false;
            if (button.isActive) {
                button.state = "active state";
            } else {
                button.state = "base state";
            }
        }
    }
    states: [
        State {
            name: "hover state"

            PropertyChanges {
                target: text
                color: "#ffffff"
                text: button.hoverText
            }

            PropertyChanges {
                target: icon
                source: urlHelper(button.hoverIcon)
            }
        },
        State {
            name: "active state"

            PropertyChanges {
                target: buttonBg
                color: "#1fc6a6"
                opacity: 1
            }

            PropertyChanges {
                target: text
                color: "#333333"
                text: button.activeText
            }

            PropertyChanges {
                target: icon
                source: urlHelper(button.activeIcon)
            }
        },
        State {
            name: "hover active state"

            PropertyChanges {
                target: buttonBg
                color: "#1fc6a6"
                opacity: 1
            }

            PropertyChanges {
                target: text
                color: "#333333"
                text: button.activeHoverText
            }

            PropertyChanges {
                target: icon
                source: urlHelper(button.activeHoverIcon)
            }
        }
    ]
}