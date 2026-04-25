import UIKit
import WebKit
import Capacitor

class MainViewController: CAPBridgeViewController {

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

        // Native edge-swipe-back, on permanently. WKWebView snapshots same-
        // document pushState transitions, but only for entries created while
        // this property is true — toggling at runtime leaves the entry that
        // was pushed when the property was off without a snapshot, which is
        // why the gesture must be enabled before any navigation. Sibling-tab
        // back-swipes are prevented at the JS layer instead: bottom-nav uses
        // replaceState so tab switches don't create a back-stack entry.
        webView.allowsBackForwardNavigationGestures = true
    }
}
