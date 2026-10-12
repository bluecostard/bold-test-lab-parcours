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
    CAPPluginMethod(name: "ping", returnType: CAPPluginReturnPromise),
  ]

  @objc func ping(_ call: CAPPluginCall) {
    call.resolve(["ok": true, "plugin": "GemeloIap"])
  }

  @objc func purchase(_ call: CAPPluginCall) {
    let productId = call.getString("productId") ?? ""
    guard !productId.isEmpty else {
      call.reject("Offre introuvable.")
      return
    }
    Task { @MainActor in
      do {
        let products: [Product]
        do {
          products = try await self.withTimeout(seconds: 20) {
            try await Product.products(for: [productId])
          }
        } catch {
          call.reject("Catalogue App Store inaccessible. Vérifiez le réseau, puis réessayez.")
          return
        }
        guard let product = products.first else {
          call.reject("Cette offre n’est pas encore ouverte dans l’App Store (produit \(productId)).")
          return
        }

        let result: Product.PurchaseResult
        do {
          result = try await self.withTimeout(seconds: 120) {
            try await self.purchaseProduct(product)
          }
        } catch {
          call.reject(error.localizedDescription.isEmpty
            ? "La fenêtre App Store ne s’est pas ouverte. Réessayez."
            : error.localizedDescription)
          return
        }

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
          call.reject("Paiement en attente d’approbation.")
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
      if expected.isEmpty {
        call.resolve()
        return
      }
      // Ne pas bloquer indéfiniment sur Transaction.unfinished
      let deadline = Date().addingTimeInterval(8)
      for await update in Transaction.unfinished {
        if Date() > deadline { break }
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
    if let active = scenes.first(where: { $0.activationState == .foregroundActive }) {
      return active
    }
    if let bridgeScene = self.bridge?.viewController?.view.window?.windowScene {
      return bridgeScene
    }
    if let keyScene = scenes.flatMap({ $0.windows }).first(where: { $0.isKeyWindow })?.windowScene {
      return keyScene
    }
    return scenes.first
  }

  private func withTimeout<T>(seconds: Double, operation: @escaping () async throws -> T) async throws -> T {
    try await withThrowingTaskGroup(of: T.self) { group in
      group.addTask { try await operation() }
      group.addTask {
        try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
        throw NSError(
          domain: "GemeloIap",
          code: 2,
          userInfo: [NSLocalizedDescriptionKey: "Délai App Store dépassé."]
        )
      }
      let value = try await group.next()!
      group.cancelAll()
      return value
    }
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
