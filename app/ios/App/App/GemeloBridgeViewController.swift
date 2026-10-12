import UIKit
import Capacitor

/// Enregistre les plugins locaux de l’app (cap sync n’ajoute que les plugins npm).
class GemeloBridgeViewController: CAPBridgeViewController {
  override open func capacitorDidLoad() {
    bridge?.registerPluginInstance(GemeloIapPlugin())
  }
}
