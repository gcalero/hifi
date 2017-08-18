//
//  WebViewActivity.java
//  interface/java
//
//  Created by Cristian Duarte and Gabriel Calero on 8/17/17.
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

package io.highfidelity.hifiinterface;

import android.app.ActionBar;
import android.app.Activity;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toolbar;

import java.net.MalformedURLException;
import java.net.URL;

public class WebViewActivity extends Activity {

    public static final String WEB_VIEW_ACTIVITY_EXTRA_URL = "url";

    private WebView myWebView;
    private ProgressBar mProgressBar;
    private ActionBar mActionBar;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_web_view);

        setActionBar((Toolbar) findViewById(R.id.toolbar_actionbar));
        mActionBar = getActionBar();

        mProgressBar = (ProgressBar) findViewById(R.id.toolbarProgressBar);

        String url = getIntent().getStringExtra(WEB_VIEW_ACTIVITY_EXTRA_URL);
        myWebView = (WebView) findViewById(R.id.web_view);
        myWebView.setWebViewClient(new HiFiWebViewClient());
        myWebView.setWebChromeClient(new HiFiWebChromeClient());
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        myWebView.loadUrl(url);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Check if the key event was the Back button and if there's history
        if ((keyCode == KeyEvent.KEYCODE_BACK) && myWebView.canGoBack()) {
            myWebView.goBack();
            return true;
        }
        // If it wasn't the Back key or there's no web page history, bubble up to the default
        // system behavior (probably exit the activity)
        return super.onKeyDown(keyCode, event);
    }

    private void showSubtitleWithUrl(String url) {
        try {
            mActionBar.setSubtitle(new URL(url.toString()).getHost());
        } catch (MalformedURLException e) {
            Log.e("openUrl", "bad url");
        }
    }

    class HiFiWebViewClient extends WebViewClient {

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            mProgressBar.setVisibility(View.GONE);
            showSubtitleWithUrl(url);
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            mProgressBar.setVisibility(View.VISIBLE);
            mProgressBar.setProgress(0);
            showSubtitleWithUrl(url);
        }

    }

    class HiFiWebChromeClient extends WebChromeClient {

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            super.onProgressChanged(view, newProgress);
            mProgressBar.setProgress(newProgress);
        }

        @Override
        public void onReceivedTitle(WebView view, String title) {
            super.onReceivedTitle(view, title);
            mActionBar.setTitle(title);
        }

    }
}
