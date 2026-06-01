import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

import type { FitRunWatchBridgeModule } from '../types';

export const watchBridge = NativeModules.FitRunWatchBridge as FitRunWatchBridgeModule | undefined;

export function isWatchBridgeAvailable() {
  return Platform.OS === 'ios' && Boolean(watchBridge);
}

export function createWatchBridgeEmitter() {
  if (!isWatchBridgeAvailable()) {
    return null;
  }

  return new NativeEventEmitter(NativeModules.FitRunWatchBridge);
}
