import UIKit
import Capacitor

/// Enregistre GemeloIap : `cap sync` n’inclut que les plugins npm dans packageClassList.
/// NSClassFromString peut aussi échouer selon le module Swift — on force l’instance ici.
class GemeloBridgeViewController: CAPBridgeViewController {
  override open func capacitorDidLoad() {
    bridge?.registerPluginInstance(GemeloIapPlugin())
    disableNativeBackSwipe()
  }

  override open func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    disableNativeBackSwipe()
  }

  /// Désactivé : le geste natif WKWebView et le swipe SPA se doublaient (souvent → Accueil).
  /// Le retour edge est géré en JS (suivi du doigt + pile Gemelo) dans AppV2.
  private func disableNativeBackSwipe() {
    webView?.allowsBackForwardNavigationGestures = false
  }
}
