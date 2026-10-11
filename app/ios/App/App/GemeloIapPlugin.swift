import Capacitor
import StoreKit
import UIKit

@objc(GemeloIapPlugin)
public class GemeloIapPlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "GemeloIapPlugin"
  public let jsName = "GemeloIap"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
  ]

  @objc func purchase(_ call: CAPPluginCall) {
    let productId = call.getString("productId") ?? ""
    guard !productId.isEmpty else {
      call.reject("Offre introuvable.")
      return
    }
    Task { @MainActor in
      do {
        let products = try await Product.products(for: [productId])
        guard let product = products.first else {
          call.reject("Cette offre n’est pas encore ouverte dans l’App Store.")
          return
        }
        let result = try await self.purchaseProduct(product)
        switch result {
        case .success(let verification):
          let transaction = try self.checked(verification)
          call.resolve([
            "jws": verification.jwsRepresentation,
            "transactionId": String(transaction.id),
          ])
        case .userCancelled:
          call.reject("Paiement annulé.")
        case .pending:
          call.reject("Paiement en attente.")
        @unknown default:
          call.reject("Paiement impossible.")
        }
      } catch {
        call.reject(error.localizedDescription)
      }
    }
  }

  @objc func finish(_ call: CAPPluginCall) {
    let expected = call.getString("transactionId") ?? ""
    Task { @MainActor in
      for await update in Transaction.unfinished {
        if let transaction = try? self.checked(update), String(transaction.id) == expected {
          await transaction.finish()
          break
        }
      }
      call.resolve()
    }
  }

  @MainActor
  private func purchaseProduct(_ product: Product) async throws -> Product.PurchaseResult {
    if #available(iOS 17.0, *) {
      if let scene = self.activeWindowScene() {
        return try await product.purchase(confirmIn: scene)
      }
    }
    return try await product.purchase()
  }

  @MainActor
  private func activeWindowScene() -> UIWindowScene? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    return scenes.first(where: { $0.activationState == .foregroundActive })
      ?? scenes.first(where: { $0.activationState == .foregroundInactive })
      ?? self.bridge?.viewController?.view.window?.windowScene
      ?? scenes.first
  }

  private func checked<T>(_ result: VerificationResult<T>) throws -> T {
    switch result {
    case .unverified:
      throw NSError(domain: "GemeloIap", code: 1, userInfo: [NSLocalizedDescriptionKey: "Achat Apple non vérifié."])
    case .verified(let value):
      return value
    }
  }
}
