import Foundation
import React
import WatchConnectivity

@objc(FitRunWatchBridge)
final class FitRunWatchBridge: RCTEventEmitter, WCSessionDelegate {
  private let latestWorkoutKey = "FitRunLatestWatchWorkout"
  private var hasListeners = false

  override init() {
    super.init()
    activateWatchSession()
  }

  override static func requiresMainQueueSetup() -> Bool {
    false
  }

  override func supportedEvents() -> [String]! {
    ["FitRunWatchWorkoutUpdate"]
  }

  override func startObserving() {
    hasListeners = true

    if let latest = latestWorkout {
      sendEvent(withName: "FitRunWatchWorkoutUpdate", body: latest)
    }
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(getLatestWorkout:rejecter:)
  func getLatestWorkout(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(latestWorkout ?? NSNull())
  }

  @objc(isWatchConnectivityAvailable:rejecter:)
  func isWatchConnectivityAvailable(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(WCSession.isSupported())
  }

  private var latestWorkout: [String: Any]? {
    UserDefaults.standard.dictionary(forKey: latestWorkoutKey)
  }

  private func activateWatchSession() {
    guard WCSession.isSupported() else {
      return
    }

    let session = WCSession.default
    session.delegate = self
    session.activate()
  }

  private func handleWorkoutPayload(_ payload: [String: Any]) {
    let workout = normalize(payload)
    UserDefaults.standard.set(workout, forKey: latestWorkoutKey)

    if hasListeners {
      sendEvent(withName: "FitRunWatchWorkoutUpdate", body: workout)
    }
  }

  private func normalize(_ payload: [String: Any]) -> [String: Any] {
    var workout = payload
    let now = Date()

    workout["receivedAt"] = isoString(from: now)

    for key in ["startedAt", "endedAt", "collectedAt"] {
      if let date = workout[key] as? Date {
        workout[key] = isoString(from: date)
      }
    }

    return workout
  }

  private func isoString(from date: Date) -> String {
    ISO8601DateFormatter().string(from: date)
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {}

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    DispatchQueue.main.async {
      self.handleWorkoutPayload(message)
    }
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    DispatchQueue.main.async {
      self.handleWorkoutPayload(userInfo)
    }
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    DispatchQueue.main.async {
      self.handleWorkoutPayload(applicationContext)
    }
  }
}
