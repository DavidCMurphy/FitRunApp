import Foundation
import HealthKit
import SwiftUI
import WatchConnectivity

@MainActor
final class WorkoutManager: NSObject, ObservableObject {
  @Published private(set) var elapsedSeconds = 0
  @Published private(set) var activeEnergyKilocalories = 0.0
  @Published private(set) var distanceMeters = 0.0
  @Published private(set) var heartRateBPM = 0.0
  @Published private(set) var isWorkoutActive = false
  @Published private(set) var statusText = "Ready"

  private let healthStore = HKHealthStore()
  private var workoutSession: HKWorkoutSession?
  private var workoutBuilder: HKLiveWorkoutBuilder?
  private var startedAt: Date?
  private var timerTask: Task<Void, Never>?
  private var lastSentSecond = -1
  private var isTimerOnlyWorkout = false
  private var isEndingWorkout = false

  var elapsedTimeText: String {
    let minutes = elapsedSeconds / 60
    let seconds = elapsedSeconds % 60
    return String(format: "%02d:%02d", minutes, seconds)
  }

  var activeEnergyText: String {
    "\(Int(activeEnergyKilocalories.rounded())) kcal"
  }

  var distanceText: String {
    distanceMeters >= 1000
      ? String(format: "%.2f km", distanceMeters / 1000)
      : "\(Int(distanceMeters.rounded())) m"
  }

  var heartRateText: String {
    heartRateBPM > 0 ? "\(Int(heartRateBPM.rounded())) bpm" : "-- bpm"
  }

  override init() {
    super.init()
    activateWatchConnectivity()
  }

  func requestAuthorization() async {
    guard HKHealthStore.isHealthDataAvailable() else {
      statusText = "Health data unavailable"
      return
    }

    let typesToShare: Set<HKSampleType> = [HKObjectType.workoutType()]
    var typesToRead: Set<HKObjectType> = [HKObjectType.workoutType()]

    [
      HKQuantityTypeIdentifier.activeEnergyBurned,
      HKQuantityTypeIdentifier.distanceWalkingRunning,
      HKQuantityTypeIdentifier.heartRate,
      HKQuantityTypeIdentifier.stepCount
    ].compactMap {
      HKObjectType.quantityType(forIdentifier: $0)
    }.forEach {
      typesToRead.insert($0)
    }

    do {
      try await healthStore.requestAuthorization(toShare: typesToShare, read: typesToRead)
      statusText = "Health access ready"
    } catch {
      statusText = "Health access failed"
    }
  }

  func startWorkout() {
    let configuration = HKWorkoutConfiguration()
    configuration.activityType = .running
    configuration.locationType = .outdoor

    do {
      let session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
      let builder = session.associatedWorkoutBuilder()
      builder.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)
      session.delegate = self
      builder.delegate = self

      let startDate = Date()
      workoutSession = session
      workoutBuilder = builder
      beginWorkout(at: startDate, timerOnly: false)

      session.startActivity(with: startDate)
      builder.beginCollection(withStart: startDate) { _, _ in }
      startTimer()
      sendWorkoutUpdate(event: "started", force: true)
    } catch {
      beginTimerOnlyWorkout()
    }
  }

  func endWorkout() {
    guard isWorkoutActive else {
      return
    }

    stopTimer()
    isWorkoutActive = false
    isEndingWorkout = true
    statusText = isTimerOnlyWorkout ? "Workout ended" : "Saving workout"
    sendWorkoutUpdate(event: "ended", force: true)

    if isTimerOnlyWorkout {
      resetWorkoutReferences()
    } else {
      workoutSession?.end()
    }
  }

  private func beginWorkout(at startDate: Date, timerOnly: Bool) {
    startedAt = startDate
    elapsedSeconds = 0
    activeEnergyKilocalories = 0
    distanceMeters = 0
    heartRateBPM = 0
    isWorkoutActive = true
    isTimerOnlyWorkout = timerOnly
    isEndingWorkout = false
    lastSentSecond = -1
    statusText = timerOnly ? "Timer running" : "Workout running"
  }

  private func beginTimerOnlyWorkout(preservingStartDate: Bool = false) {
    resetWorkoutReferences()

    if preservingStartDate, let startedAt {
      beginWorkout(at: startedAt, timerOnly: true)
    } else {
      beginWorkout(at: Date(), timerOnly: true)
    }

    startTimer()
    sendWorkoutUpdate(event: "started", force: true)
  }

  private func resetWorkoutReferences() {
    workoutSession = nil
    workoutBuilder = nil
    isTimerOnlyWorkout = false
    isEndingWorkout = false
  }

  private func startTimer() {
    timerTask?.cancel()
    elapsedSeconds = elapsedSecondsSinceStart()

    timerTask = Task { [weak self] in
      while !Task.isCancelled {
        try? await Task.sleep(for: .seconds(1))

        await MainActor.run {
          guard let self, !Task.isCancelled else {
            return
          }

          self.elapsedSeconds = self.elapsedSecondsSinceStart()
          self.sendWorkoutUpdate(event: "tick")
        }
      }
    }
  }

  private func stopTimer() {
    timerTask?.cancel()
    timerTask = nil
  }

  private func elapsedSecondsSinceStart() -> Int {
    guard let startedAt else {
      return 0
    }

    return max(0, Int(Date().timeIntervalSince(startedAt)))
  }

  private func sendWorkoutUpdate(event: String, force: Bool = false) {
    guard force || elapsedSeconds != lastSentSecond else {
      return
    }

    lastSentSecond = elapsedSeconds

    var payload: [String: Any] = [
      "event": event,
      "state": isWorkoutActive ? "active" : "ended",
      "mode": isTimerOnlyWorkout ? "timerOnly" : "healthKit",
      "activityType": "running",
      "elapsedSeconds": elapsedSeconds,
      "activeEnergyKilocalories": activeEnergyKilocalories,
      "distanceMeters": distanceMeters,
      "heartRateBPM": heartRateBPM,
      "collectedAt": Date()
    ]

    if let startedAt {
      payload["startedAt"] = startedAt
    }

    if !isWorkoutActive {
      payload["endedAt"] = Date()
    }

    let session = WCSession.default
    guard WCSession.isSupported(), session.activationState == .activated else {
      return
    }

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

  private func activateWatchConnectivity() {
    guard WCSession.isSupported() else {
      return
    }

    let session = WCSession.default
    session.delegate = self
    session.activate()
  }
}

extension WorkoutManager: HKWorkoutSessionDelegate {
  nonisolated func workoutSession(
    _ workoutSession: HKWorkoutSession,
    didChangeTo toState: HKWorkoutSessionState,
    from fromState: HKWorkoutSessionState,
    date: Date
  ) {
    Task { @MainActor in
      if toState == .ended {
        if self.isWorkoutActive && !self.isEndingWorkout {
          self.beginTimerOnlyWorkout(preservingStartDate: true)
          return
        }

        self.stopTimer()
        self.isWorkoutActive = false
        self.statusText = "Workout saved"

        if let builder = self.workoutBuilder {
          Task {
            try? await builder.endCollection(at: date)
            _ = try? await builder.finishWorkout()
          }
        }

        self.sendWorkoutUpdate(event: "saved", force: true)
        self.resetWorkoutReferences()
      }
    }
  }

  nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
    Task { @MainActor in
      if self.isWorkoutActive && !self.isTimerOnlyWorkout && !self.isEndingWorkout {
        self.beginTimerOnlyWorkout(preservingStartDate: true)
        return
      }

      self.stopTimer()
      self.isWorkoutActive = false
      self.statusText = "Workout failed"
      self.sendWorkoutUpdate(event: "failed", force: true)
      self.resetWorkoutReferences()
    }
  }
}

extension WorkoutManager: HKLiveWorkoutBuilderDelegate {
  nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

  nonisolated func workoutBuilder(
    _ workoutBuilder: HKLiveWorkoutBuilder,
    didCollectDataOf collectedTypes: Set<HKSampleType>
  ) {
    Task { @MainActor in
      for type in collectedTypes {
        guard let quantityType = type as? HKQuantityType,
              let statistics = workoutBuilder.statistics(for: quantityType) else {
          continue
        }

        switch quantityType.identifier {
        case HKQuantityTypeIdentifier.activeEnergyBurned.rawValue:
          let unit = HKUnit.kilocalorie()
          self.activeEnergyKilocalories = statistics.sumQuantity()?.doubleValue(for: unit) ?? 0
        case HKQuantityTypeIdentifier.distanceWalkingRunning.rawValue:
          let unit = HKUnit.meter()
          self.distanceMeters = statistics.sumQuantity()?.doubleValue(for: unit) ?? 0
        case HKQuantityTypeIdentifier.heartRate.rawValue:
          let unit = HKUnit.count().unitDivided(by: HKUnit.minute())
          self.heartRateBPM = statistics.mostRecentQuantity()?.doubleValue(for: unit) ?? 0
        default:
          break
        }
      }

      self.sendWorkoutUpdate(event: "metrics")
    }
  }
}

extension WorkoutManager: WCSessionDelegate {
  nonisolated func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {}
}
