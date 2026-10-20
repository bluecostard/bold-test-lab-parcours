import AVFoundation
import Capacitor
import Foundation
import UIKit

/// Trim + compression pitch (AVAssetExportSession) — fiable sur iOS où captureStream est absent.
@objc(GemeloVideoPlugin)
public class GemeloVideoPlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "GemeloVideoPlugin"
  public let jsName = "GemeloVideo"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "ping", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "beginImport", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "appendImport", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "cancelImport", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "exportClip", returnType: CAPPluginReturnPromise),
  ]

  private var imports: [String: URL] = [:]
  private let ioQueue = DispatchQueue(label: "online.gemelo.video.io")

  @objc func ping(_ call: CAPPluginCall) {
    call.resolve(["ok": true, "plugin": "GemeloVideo", "trim": true])
  }

  @objc func beginImport(_ call: CAPPluginCall) {
    let jobId = UUID().uuidString
    let ext = sanitizedExtension(call.getString("name") ?? "pitch.mp4")
    let url = FileManager.default.temporaryDirectory
      .appendingPathComponent("gemelo-pitch-in-\(jobId).\(ext)")
    FileManager.default.createFile(atPath: url.path, contents: nil)
    ioQueue.sync { imports[jobId] = url }
    call.resolve(["jobId": jobId])
  }

  @objc func appendImport(_ call: CAPPluginCall) {
    let jobId = call.getString("jobId") ?? ""
    let chunk = call.getString("data") ?? ""
    guard !jobId.isEmpty, !chunk.isEmpty else {
      call.reject("Fragment vidéo manquant.")
      return
    }
    guard let url = ioQueue.sync(execute: { imports[jobId] }) else {
      call.reject("Import vidéo introuvable.")
      return
    }
    guard let data = Data(base64Encoded: chunk, options: [.ignoreUnknownCharacters]) else {
      call.reject("Fragment vidéo invalide.")
      return
    }
    do {
      let handle = try FileHandle(forWritingTo: url)
      defer { try? handle.close() }
      try handle.seekToEnd()
      try handle.write(contentsOf: data)
      call.resolve(["ok": true, "bytes": data.count])
    } catch {
      call.reject("Écriture vidéo impossible.")
    }
  }

  @objc func cancelImport(_ call: CAPPluginCall) {
    let jobId = call.getString("jobId") ?? ""
    if let url = ioQueue.sync(execute: { () -> URL? in
      let value = imports.removeValue(forKey: jobId)
      return value
    }) {
      try? FileManager.default.removeItem(at: url)
    }
    call.resolve(["ok": true])
  }

  @objc func exportClip(_ call: CAPPluginCall) {
    let jobId = call.getString("jobId") ?? ""
    let start = max(0, call.getDouble("start") ?? 0)
    let duration = max(1, call.getDouble("duration") ?? 60)
    let maxBytes = max(1_000_000, call.getInt("maxBytes") ?? 100_000_000)

    guard let inputURL = ioQueue.sync(execute: { imports[jobId] }) else {
      call.reject("Import vidéo introuvable.")
      return
    }

    Task {
      do {
        let output = try await self.export(
          inputURL: inputURL,
          start: start,
          duration: duration,
          maxBytes: maxBytes
        )
        let data = try Data(contentsOf: output)
        let base64 = data.base64EncodedString()
        let name = "pitch-extrait.mp4"
        try? FileManager.default.removeItem(at: output)
        self.ioQueue.sync {
          if let url = self.imports.removeValue(forKey: jobId) {
            try? FileManager.default.removeItem(at: url)
          }
        }
        call.resolve([
          "ok": true,
          "base64": base64,
          "mimeType": "video/mp4",
          "name": name,
          "bytes": data.count,
        ])
      } catch {
        self.ioQueue.sync {
          if let url = self.imports.removeValue(forKey: jobId) {
            try? FileManager.default.removeItem(at: url)
          }
        }
        call.reject(error.localizedDescription)
      }
    }
  }

  private func sanitizedExtension(_ name: String) -> String {
    let ext = (name as NSString).pathExtension.lowercased()
    if ["mp4", "mov", "m4v"].contains(ext) { return ext }
    return "mp4"
  }

  private func export(
    inputURL: URL,
    start: Double,
    duration: Double,
    maxBytes: Int
  ) async throws -> URL {
    let asset = AVURLAsset(url: inputURL)
    let total = try await asset.load(.duration).seconds
    guard total.isFinite, total > 0 else {
      throw videoError("Impossible de lire cette vidéo. Essayez un MP4 ou un MOV.")
    }
    let safeStart = min(max(0, start), max(0, total - 0.2))
    let safeDuration = min(duration, max(0.2, total - safeStart))
    let timeRange = CMTimeRange(
      start: CMTime(seconds: safeStart, preferredTimescale: 600),
      duration: CMTime(seconds: safeDuration, preferredTimescale: 600)
    )

    let preferred = [
      AVAssetExportPreset1280x720,
      AVAssetExportPreset960x540,
      AVAssetExportPreset640x480,
      AVAssetExportPresetMediumQuality,
      AVAssetExportPresetLowQuality,
    ]
    let compatible = Set(AVAssetExportSession.exportPresets(compatibleWith: asset))
    let presets = preferred.filter { compatible.contains($0) }
    guard !presets.isEmpty else {
      throw videoError("Format vidéo non pris en charge. Exportez un MP4 depuis Photos.")
    }

    var lastError: Error = videoError("Compression vidéo impossible.")
    for preset in presets {
      do {
        let url = try await exportOnce(asset: asset, preset: preset, timeRange: timeRange)
        let size = (try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? NSNumber)?.intValue ?? Int.max
        if size <= maxBytes {
          return url
        }
        try? FileManager.default.removeItem(at: url)
        lastError = videoError(
          "L’extrait fait encore trop lourd. Choisissez 15 ou 30 s, puis réessayez."
        )
      } catch {
        lastError = error
      }
    }
    throw lastError
  }

  private func exportOnce(asset: AVURLAsset, preset: String, timeRange: CMTimeRange) async throws -> URL {
    guard let session = AVAssetExportSession(asset: asset, presetName: preset) else {
      throw videoError("Export vidéo indisponible sur cet appareil.")
    }
    let out = FileManager.default.temporaryDirectory
      .appendingPathComponent("gemelo-pitch-out-\(UUID().uuidString).mp4")
    try? FileManager.default.removeItem(at: out)
    session.outputURL = out
    session.outputFileType = .mp4
    session.shouldOptimizeForNetworkUse = true
    session.timeRange = timeRange
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      session.exportAsynchronously {
        switch session.status {
        case .completed:
          continuation.resume()
        case .cancelled:
          continuation.resume(throwing: self.videoError("Compression annulée."))
        default:
          let message = session.error?.localizedDescription ?? "Échec de la compression."
          continuation.resume(throwing: self.videoError(message))
        }
      }
    }
    return out
  }

  private func videoError(_ message: String) -> NSError {
    NSError(domain: "GemeloVideo", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
  }
}
