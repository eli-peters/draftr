import UIKit
import WebKit
import Capacitor

class MainViewController: CAPBridgeViewController, WKScriptMessageHandler {

    override func viewDidLoad() {
        super.viewDidLoad()

        guard let webView = self.webView else { return }

        // Disable WKWebView outer rubber-band so the page header / bottom nav
        // stay pinned during overscroll. Inner scrollable elements still bounce.
        webView.scrollView.bounces = false
        webView.scrollView.alwaysBounceVertical = false
        webView.scrollView.alwaysBounceHorizontal = false

        // Pair with capacitor.config.ts `contentInset: 'never'`. The web layer
        // owns safe-area math via env(safe-area-inset-*); double-counting it
        // here is what produced the gap above the header.
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        // Native edge-swipe-back. Off by default — the web layer flips it on
        // for hierarchical child routes (L2/L3) via the `swipeGate` handler
        // below. Keeping it gated prevents swipe-back between L1 tabs, which
        // share WKWebView history but aren't a hierarchical relationship.
        webView.allowsBackForwardNavigationGestures = false
        webView.configuration.userContentController.add(self, name: "swipeGate")
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.name == "swipeGate",
              let body = message.body as? [String: Any],
              let enabled = body["enabled"] as? Bool else { return }
        webView?.allowsBackForwardNavigationGestures = enabled
    }
}
