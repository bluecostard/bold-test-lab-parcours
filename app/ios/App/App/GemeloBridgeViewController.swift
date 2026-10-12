import UIKit
import Capacitor

/// Enregistre GemeloIap : `cap sync` n’inclut que les plugins npm dans packageClassList.
/// NSClassFromString peut aussi échouer selon le module Swift — on force l’instance ici.
class GemeloBridgeViewController: CAPBridgeViewController {
  override open func capacitorDidLoad() {
    bridge?.registerPluginInstance(GemeloIapPlugin())
  }

  override open func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    // Glissement depuis le bord gauche (geste système iOS) → history.back → popstate SPA.
    webView?.allowsBackForwardNavigationGestures = true
  }
}
