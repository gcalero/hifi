import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtQuick.Layouts 1.3

Item {
    id: button
    property string icon: "icons/tablet-icons/edit-i.svg"
    property string text: "EDIT"

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
}