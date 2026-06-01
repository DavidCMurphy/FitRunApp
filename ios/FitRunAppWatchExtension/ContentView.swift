import SwiftUI

struct ContentView: View {
  @EnvironmentObject private var workoutManager: WorkoutManager

  var body: some View {
    VStack(spacing: 14) {
      VStack(spacing: 3) {
        Text(workoutManager.currentInterval.label)
          .font(.title3.weight(.semibold))
        Text(workoutManager.intervalRemainingText)
          .font(.system(size: 38, weight: .bold, design: .rounded))
          .monospacedDigit()
        Text(workoutManager.planSummaryText)
          .font(.caption2)
          .foregroundStyle(.secondary)
          .lineLimit(2)
          .multilineTextAlignment(.center)
      }

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
}
