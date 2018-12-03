package io.highfidelity.hifiinterface;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.View;

public class SplashActivity extends Activity {

    public static final String EXTRA_DAYDREAM_START = "daydream_start";

    private native void registerLoadCompleteListener();
    private boolean mIsDaydreamStart;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mIsDaydreamStart = getIntent().getBooleanExtra(EXTRA_DAYDREAM_START, false);
        setContentView(R.layout.activity_splash);
        if (mIsDaydreamStart) {
            findViewById(R.id.hifi_logo).setVisibility(View.INVISIBLE);
            findViewById(R.id.progress_bar).setVisibility(View.INVISIBLE);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        }
        registerLoadCompleteListener();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        if (mIsDaydreamStart && newConfig.orientation == Configuration.ORIENTATION_PORTRAIT){
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        } else if (!mIsDaydreamStart) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        }
        super.onConfigurationChanged(newConfig);
    }

    @Override
    protected void onStart() {
        super.onStart();
    }

    @Override
    protected void onResume() {
        super.onResume();
        View decorView = getWindow().getDecorView();
        // Hide the status bar.
        int uiOptions = View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
    }

    @Override
    protected void onStop() {
        super.onStop();
    }

    public void onAppLoadedComplete() {
        if (!mIsDaydreamStart) {
            if (HifiUtils.getInstance().isUserLoggedIn()) {
                startActivity(new Intent(this, MainActivity.class));
            } else {
                Intent menuIntent = new Intent(this, LoginMenuActivity.class);
                menuIntent.putExtra(LoginMenuActivity.EXTRA_FINISH_ON_BACK, true);
                startActivity(menuIntent);
            }
        }
        SplashActivity.this.finish();
    }
}
