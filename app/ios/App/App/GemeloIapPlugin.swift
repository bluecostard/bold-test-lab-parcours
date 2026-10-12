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
    call.resolve(["ok": true, "plugin": "GemeloIap", "registered": true])
  }

  @objc func purchase(_ call: CAPPluginCall) {
    let productId = call.getString("productId") ?? ""
    guard !productId.isEmpty else {
      call.reject("Offre introuvable.")
      return
    }
    Task { @MainActor in
      do {
        // Si un achat précédent n’a pas été confirmé serveur, le renvoyer (ne pas finish).
        if let pending = await self.pendingPurchase(productId: productId) {
          call.resolve(pending)
          return
        }

        let products: [Product]
        do {
          products = try await self.withTimeout(seconds: 25) {
            try await Product.products(for: [productId])
          }
        } catch {
          call.reject("Catalogue App Store inaccessible pour \(productId). Vérifiez le réseau / Sandbox.")
          return
        }
        guard let product = products.first else {
          call.reject("Offre App Store introuvable (\(productId)). Vérifiez App Store Connect.")
          return
        }

        // purchase() simple : confirmIn: peut rester bloqué sans feuille visible.
        let result: Product.PurchaseResult
        do {
          result = try await self.withTimeout(seconds: 90) {
            try await product.purchase()
          }
        } catch {
          let message = error.localizedDescription
          call.reject(message.isEmpty ? "Délai App Store dépassé." : message)
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
      if !expected.isEmpty {
        await self.finishTransaction(id: expected, seconds: 6)
      }
      call.resolve()
    }
  }

  @MainActor
  private func pendingPurchase(productId: String) async -> [String: String]? {
    let deadline = Date().addingTimeInterval(2)
    for await update in Transaction.unfinished {
      if Date() > deadline { break }
      guard let transaction = try? checked(update) else { continue }
      if transaction.productID == productId {
        return [
          "jws": update.jwsRepresentation,
          "transactionId": String(transaction.id),
        ]
      }
    }
    return nil
  }

  @MainActor
  private func finishTransaction(id: String, seconds: Double) async {
    let deadline = Date().addingTimeInterval(seconds)
    for await update in Transaction.unfinished {
      if Date() > deadline { break }
      if let transaction = try? checked(update), String(transaction.id) == id {
        await transaction.finish()
        break
      }
    }
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
      defer { group.cancelAll() }
      return try await group.next()!
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
