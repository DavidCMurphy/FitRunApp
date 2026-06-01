import Foundation
import React
import WatchConnectivity

@objc(FitRunWatchBridge)
final class FitRunWatchBridge: RCTEventEmitter, WCSessionDelegate {
  private let latestWorkoutKey = "FitRunLatestWatchWorkout"
  private let runPlanKey = "FitRunRunWalkPlan"
  private var hasListeners = false

  override init() {
    super.init()
    activateWatchSession()
  }

  override static func requiresMainQueueSetup() -> Bool {
    false
  }

  override func supportedEvents() -> [String]! {
    ["FitRunWatchWorkoutUpdate", "FitRunRunPlanUpdate"]
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

  @objc(getRunPlan:rejecter:)
  func getRunPlan(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(runPlan ?? NSNull())
  }

  @objc(setRunPlan:resolver:rejecter:)
  func setRunPlan(_ plan: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    guard let normalizedPlan = normalizeRunPlan(plan as? [String: Any] ?? [:]) else {
      reject("invalid_run_plan", "Run plan must include positive run and walk durations.", nil)
      return
    }

    UserDefaults.standard.set(normalizedPlan, forKey: runPlanKey)

    if hasListeners {
      sendEvent(withName: "FitRunRunPlanUpdate", body: normalizedPlan)
    }

    sendRunPlanToWatch(normalizedPlan)
    resolve(normalizedPlan)
  }

  private var latestWorkout: [String: Any]? {
    UserDefaults.standard.dictionary(forKey: latestWorkoutKey)
  }

  private var runPlan: [String: Any]? {
    UserDefaults.standard.dictionary(forKey: runPlanKey)
  }

  private func activateWatchSession() {
    guard WCSession.isSupported() else {
      return
    }

    let session = WCSession.default
    session.delegate = self
    session.activate()
  }

  private func sendRunPlanToWatch(_ plan: [String: Any]) {
    guard WCSession.isSupported() else {
      return
    }

    let session = WCSession.default
    let payload: [String: Any] = ["runPlan": plan]

    do {
      try session.updateApplicationContext(payload)
    } catch {
      session.transferUserInfo(payload)
    }

    if session.isReachable {
      session.sendMessage(payload, replyHandler: nil) { _ in
        session.transferUserInfo(payload)
      }
    } else {
      session.transferUserInfo(payload)
    }
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

  private func normalizeRunPlan(_ plan: [String: Any]) -> [String: Any]? {
    let runSeconds = intValue(plan["runSeconds"])
    let walkSeconds = intValue(plan["walkSeconds"])

    guard runSeconds > 0, walkSeconds > 0 else {
      return nil
    }

    let repeatCount = max(1, intValue(plan["repeatCount"]))
    let warmupSeconds = max(0, intValue(plan["warmupSeconds"]))
    let cooldownSeconds = max(0, intValue(plan["cooldownSeconds"]))
    let enabled = boolValue(plan["enabled"], defaultValue: true)
    let title = (plan["title"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)

    return [
      "title": title?.isEmpty == false ? title! : "Run Walk 5K",
      "enabled": enabled,
      "runSeconds": runSeconds,
      "walkSeconds": walkSeconds,
      "repeatCount": repeatCount,
      "warmupSeconds": warmupSeconds,
      "cooldownSeconds": cooldownSeconds,
      "updatedAt": isoString(from: Date())
    ]
  }

  private func intValue(_ value: Any?) -> Int {
    if let int = value as? Int {
      return int
    }

    if let number = value as? NSNumber {
      return number.intValue
    }

    if let string = value as? String {
      return Int(string) ?? 0
    }

    return 0
  }

  private func boolValue(_ value: Any?, defaultValue: Bool) -> Bool {
    if let bool = value as? Bool {
      return bool
    }

    if let number = value as? NSNumber {
      return number.boolValue
    }

    return defaultValue
  }

  private func isoString(from date: Date) -> String {
    ISO8601DateFormatter().string(from: date)
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    if activationState == .activated, let runPlan {
      sendRunPlanToWatch(runPlan)
    }
  }

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
