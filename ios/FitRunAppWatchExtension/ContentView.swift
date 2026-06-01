import SwiftUI

struct ContentView: View {
  @EnvironmentObject private var workoutManager: WorkoutManager

  var body: some View {
    VStack(spacing: 12) {
      Text(workoutManager.elapsedTimeText)
        .font(.system(size: 34, weight: .bold, design: .rounded))
        .monospacedDigit()

      VStack(spacing: 4) {
        metricRow("Energy", workoutManager.activeEnergyText)
        metricRow("Distance", workoutManager.distanceText)
        metricRow("Heart", workoutManager.heartRateText)
      }
      .font(.caption)

      Button(workoutManager.isWorkoutActive ? "End Workout" : "Start Run") {
        workoutManager.isWorkoutActive ? workoutManager.endWorkout() : workoutManager.startWorkout()
      }
      .buttonStyle(.borderedProminent)
      .tint(workoutManager.isWorkoutActive ? .red : .green)

      Text(workoutManager.statusText)
        .font(.footnote)
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)
    }
    .padding()
    .task {
      await workoutManager.requestAuthorization()
    }
  }

  private func metricRow(_ label: String, _ value: String) -> some View {
    HStack {
      Text(label)
      Spacer()
      Text(value)
        .monospacedDigit()
    }
  }
}
