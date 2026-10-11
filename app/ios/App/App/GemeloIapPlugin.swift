import Capacitor
import StoreKit

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
    Task {
      do {
        let products = try await Product.products(for: [productId])
        guard let product = products.first else {
          call.reject("Cette offre n’est pas encore ouverte dans l’App Store.")
          return
        }
        let result = try await product.purchase()
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
    Task {
      for await update in Transaction.unfinished {
        if let transaction = try? checked(update), String(transaction.id) == expected {
          await transaction.finish()
          break
        }
      }
      call.resolve()
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
