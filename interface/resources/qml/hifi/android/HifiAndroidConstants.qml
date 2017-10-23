//
//  HifiAndroidConstants.qml
//  interface/resources/qml/android
//
//  Created by Gabriel Calero & Cristian Duarte on 23 Oct 2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import QtQuick 2.4

Item {

    id: android

    readonly property alias dimen: dimen
    readonly property alias color: color

    Item {
        id: dimen
        readonly property real windowLessWidth: 42.5
        readonly property real windowLessHeight: 21.25

        readonly property real windowZ: 100

        readonly property real headerHeight: 92

        readonly property real headerIconPosX: 30.44
        readonly property real headerIconPosY: 36.54
        readonly property real headerIconWidth: 37
        readonly property real headerIconHeight: 37
        readonly property real headerIconTitleDistance: 57.78

        readonly property real headerHideWidth: 50
        readonly property real headerHideHeight: 50
        readonly property real headerHideRightMargin: 26.25
        readonly property real headerHideTopMargin: 37.04
        readonly property real headerHideIconWidth: 23.67
        readonly property real headerHideIconHeight: 13.06
        readonly property real headerHideTextTopMargin: 12

    }

    Item {
        id: color
        readonly property color gradientTop: "#4E4E4E"
        readonly property color gradientBottom: "#242424"
    }
/*
    SystemPalette { id: sysPalette; colorGroup: SystemPalette.Active }
    readonly property alias colors: colors
    readonly property alias layout: layout
    readonly property alias fonts: fonts
    readonly property alias styles: styles
    readonly property alias effects: effects

    Item {
        id: colors
        readonly property color hifiBlue: "#0e7077"
        readonly property color window: sysPalette.window
        readonly property color dialogBackground: sysPalette.window
        readonly property color inputBackground: "white"
        readonly property color background: sysPalette.dark
        readonly property color text: "#202020"
        readonly property color disabledText: "gray"
        readonly property color hintText: "gray"  // A bit darker than sysPalette.dark so that it is visible on the DK2
        readonly property color light: sysPalette.light
        readonly property alias activeWindow: activeWindow
        readonly property alias inactiveWindow: inactiveWindow
        QtObject {
            id: activeWindow
            readonly property color headerBackground: "white"
            readonly property color headerText: "black"
        }
        QtObject {
            id: inactiveWindow
            readonly property color headerBackground: "gray"
            readonly property color headerText: "black"
        }
     }

    QtObject {
        id: fonts
        readonly property string fontFamily: "Arial"  // Available on both Windows and OSX
        readonly property real pixelSize: 22  // Logical pixel size; works on Windows and OSX at varying physical DPIs
        readonly property real headerPixelSize: 32
    }

    QtObject {
        id: layout
        property int spacing: 8
        property int rowHeight: 40
        property int windowTitleHeight: 48
    }

    QtObject {
        id: styles
        readonly property int borderWidth: 5
        readonly property int borderRadius: borderWidth * 2
    }

    QtObject {
        id: effects
        readonly property int fadeInDuration: 300
    }*/
}
