import SwiftUI

@main
struct FitRunAppWatchApp: App {
  @StateObject private var workoutManager = WorkoutManager()

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(workoutManager)
    }
  }
}
