import UIKit
import Capacitor

/// Enregistre GemeloIap : `cap sync` n’inclut que les plugins npm dans packageClassList.
/// NSClassFromString peut aussi échouer selon le module Swift — on force l’instance ici.
class GemeloBridgeViewController: CAPBridgeViewController {
  override open func capacitorDidLoad() {
    bridge?.registerPluginInstance(GemeloIapPlugin())
  }
}
