//
//  InterfaceActivity.java
//  gvr-interface/java
//
//  Created by Stephen Birarda on 1/26/15.
//  Copyright 2015 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

package io.highfidelity.hifiinterface;

import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;
import android.util.Log;
import org.qtproject.qt5.android.bindings.QtActivity;

import com.google.vr.cardboard.DisplaySynchronizer;
import com.google.vr.cardboard.DisplayUtils;
import com.google.vr.ndk.base.GvrApi;
import android.graphics.Point;
import android.content.res.Configuration;
import android.content.pm.ActivityInfo;

public class InterfaceActivity extends QtActivity {
    
    public static native void handleHifiURL(String hifiURLString);
    private native long nativeOnCreate(InterfaceActivity instance, AssetManager assetManager, long gvrContextPtr);
    private native void saveRealScreenSize(int width, int height);
    private native long nativeOnExitVr();

    private AssetManager assetManager;

    private static boolean inVrMode;

    // Opaque native pointer to the Application C++ object.
    // This object is owned by the InterfaceActivity instance and passed to the native methods.
    //private long nativeGvrApi;
    
    public void enterVr() {
        //Log.d("[VR]", "Entering Vr mode (java)");
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        inVrMode = true;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Get the intent that started this activity in case we have a hifi:// URL to parse
        Intent intent = getIntent();
        if (intent.getAction() == Intent.ACTION_VIEW) {
            Uri data = intent.getData();
        
            if (data.getScheme().equals("hifi")) {
                handleHifiURL(data.toString());
            }
        }
        
        DisplaySynchronizer displaySynchronizer = new DisplaySynchronizer(this, DisplayUtils.getDefaultDisplay(this));
        GvrApi gvrApi = new GvrApi(this, displaySynchronizer);
        Log.d("GVR", "gvrApi.toString(): " + gvrApi.toString());

        assetManager = getResources().getAssets();

        //nativeGvrApi =
            nativeOnCreate(this, assetManager, gvrApi.getNativeGvrContext());

        Point size = new Point();
        getWindowManager().getDefaultDisplay().getRealSize(size);
        saveRealScreenSize(size.x, size.y);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // Checks the orientation of the screen
        if (newConfig.orientation == Configuration.ORIENTATION_PORTRAIT){
//            Log.d("[VR]", "Portrait, forcing landscape");
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
            if (inVrMode) {
                inVrMode = false;
//                Log.d("[VR]", "Starting VR exit");
                nativeOnExitVr();                
            } else {
                Log.w("[VR]", "Portrait detected but not in VR mode. Should not happen");
            }
        }
    }
}