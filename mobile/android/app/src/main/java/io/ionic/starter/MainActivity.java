package io.ionic.starter;

import android.os.Bundle;
import android.graphics.Color;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Prevent black background flash during webview loading/bootstrap
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setBackgroundColor(Color.TRANSPARENT);
        }
    }
}
