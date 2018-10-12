package io.highfidelity.hifiinterface;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.text.TextUtils;
import android.view.View;

import static io.highfidelity.hifiinterface.service.FirebaseMessagingService.NOTIFICATION_CONNECTED_USER;

public class SplashActivity extends Activity {

    private native void registerLoadCompleteListener();

    private String notificationUserConnected;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);
        registerLoadCompleteListener();

        if (getIntent().hasExtra(NOTIFICATION_CONNECTED_USER)) {
            notificationUserConnected = getIntent().getStringExtra(NOTIFICATION_CONNECTED_USER);
        }

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
        Intent mainIntent = new Intent(this, MainActivity.class);
        if (!TextUtils.isEmpty(notificationUserConnected)) {
            mainIntent.putExtra(NOTIFICATION_CONNECTED_USER, notificationUserConnected);
        }
        startActivity(mainIntent);
        SplashActivity.this.finish();
    }
}
