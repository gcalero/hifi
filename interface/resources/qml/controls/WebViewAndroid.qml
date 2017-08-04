import QtQuick 2.2
import QtQuick.Controls 1.1
import QtWebView 1.0
import QtQuick.Layouts 1.1
import QtQuick.Controls.Styles 1.2

Item {

    property string url: "https://highfidelity.com/"

    // For the moment, we won't use WebView as it takes the entire screen instead of the surface
	//property alias url: webView.url
	/*WebView {
        id: webView
        anchors.fill: parent
        url: initialUrl
    }*/
        Text {
            id: webContentText
            anchors.horizontalCenter : parent.horizontalCenter
            text: "Web content\nClick to view"
            font.family: "Helvetica"
            font.pointSize: 24
            color: "#0098CA"
        }

        Text { 
            id: urlText
            text: url
            anchors.horizontalCenter : parent.horizontalCenter
            anchors.top : webContentText.bottom
            font.family: "Helvetica"
            font.pointSize: 18
            color: "#0098CA"
        }
}