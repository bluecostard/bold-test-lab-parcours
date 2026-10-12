import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // Le storyboard Main fournit déjà GemeloBridgeViewController.
        // Ne pas créer une 2ᵉ fenêtre : sinon le JS parle à un bridge mort et ping/purchase restent pendus.
        if let existing = windowScene.windows.first {
            window = existing
            if !(existing.rootViewController is GemeloBridgeViewController) {
                existing.rootViewController = GemeloBridgeViewController()
            }
        } else {
            let created = UIWindow(windowScene: windowScene)
            created.rootViewController = GemeloBridgeViewController()
            created.makeKeyAndVisible()
            window = created
        }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
