import UIKit
import Capacitor

/// Enregistre GemeloIap : `cap sync` n’inclut que les plugins npm dans packageClassList.
class GemeloBridgeViewController: CAPBridgeViewController {
  override open func capacitorDidLoad() {
    bridge?.registerPluginInstance(GemeloIapPlugin())
  }
}
