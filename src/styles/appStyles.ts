import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f8f3'
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 18
  },
  header: {
    gap: 6
  },
  appName: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '800'
  },
  subtitle: {
    color: '#667085',
    fontSize: 16,
    fontWeight: '600'
  },
  metricPanel: {
    minHeight: 245,
    borderRadius: 8,
    backgroundColor: '#d8f36f',
    padding: 24,
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 30,
    elevation: 4
  },
  metricLabel: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10
  },
  metricValue: {
    color: '#111827',
    fontSize: 70,
    fontWeight: '900'
  },
  metricUnit: {
    color: '#1f2937',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2
  },
  loader: {
    position: 'absolute',
    right: 24,
    top: 24
  },
  statusPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    padding: 18,
    gap: 10
  },
  statusText: {
    color: '#111827',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600'
  },
  updatedText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '600'
  },
  watchPanel: {
    borderRadius: 8,
    backgroundColor: '#111827',
    padding: 18,
    gap: 12
  },
  watchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  watchTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  watchState: {
    color: '#d8f36f',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  watchTimer: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '900'
  },
  watchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  watchMetric: {
    width: '47%',
    borderRadius: 8,
    backgroundColor: '#1f2937',
    padding: 12,
    gap: 4
  },
  watchMetricLabel: {
    color: '#a7b0c0',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  watchMetricValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  watchMessage: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  planPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    padding: 18,
    gap: 12
  },
  planTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800'
  },
  planToggle: {
    minWidth: 54,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  planToggleActive: {
    backgroundColor: '#d8f36f',
    borderColor: '#abc92e'
  },
  planToggleText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '900'
  },
  planToggleTextActive: {
    color: '#111827'
  },
  planSummary: {
    color: '#111827',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800'
  },
  planControls: {
    gap: 10
  },
  planControl: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  planControlLabel: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '800'
  },
  planStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  planControlValue: {
    minWidth: 64,
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center'
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperButtonText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900'
  },
  planMessage: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800'
  },
  disabledButton: {
    opacity: 0.56
  },
  loginKeyboardView: {
    flex: 1
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 28
  },
  authScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 28
  },
  loginHero: {
    gap: 8
  },
  loginEyebrow: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  loginTitle: {
    color: '#111827',
    fontSize: 42,
    fontWeight: '900'
  },
  loginSubtitle: {
    maxWidth: 320,
    color: '#475467',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '600'
  },
  loginForm: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    padding: 18,
    gap: 16,
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 3
  },
  inputGroup: {
    gap: 8
  },
  inputLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '900'
  },
  textInput: {
    minHeight: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14
  },
  loginError: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700'
  },
  authSwitch: {
    gap: 10
  },
  authSwitchText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center'
  }
});
