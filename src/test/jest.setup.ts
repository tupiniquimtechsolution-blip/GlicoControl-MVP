/**
 * Setup global: silencia/determiniza módulos nativos.
 * `demo-local` só existe para testes/DEV (ver AuthContext) — nunca em produção.
 */
process.env.EXPO_PUBLIC_DEMO_MODE = 'demo-local'

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react')
  return { __esModule: true, default: (props: { name?: string }) => React.createElement('Text', null, props.name ?? 'icon') }
})

jest.mock('expo-router', () => {
  const React = require('react')
  const mockRouterState = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() }
  ;(globalThis as Record<string, unknown>).__mockRouter = mockRouterState
  return {
    __esModule: true,
    router: mockRouterState,
    Router: mockRouterState,
    Link: ({ children }: { children: React.ReactNode }) => React.createElement('Text', null, children),
    Redirect: () => null,
    Stack: Object.assign(({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children), { Screen: () => null }),
    Tabs: Object.assign(({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children), { Screen: () => null }),
    useLocalSearchParams: () => (globalThis as Record<string, unknown>).__mockParams ?? {},
    useSegments: () => [],
    useNavigation: () => ({ setOptions: jest.fn(), addListener: () => ({ remove: jest.fn() }) }),
    usePathname: () => '/',
  }
})

jest.mock('expo-notifications', () => {
  const mockScheduled: unknown[] = []
  ;(globalThis as Record<string, unknown>).__mockScheduled = mockScheduled
  return {
    __esModule: true,
    getExpoPushTokenAsync: jest.fn(),
    getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    scheduleNotificationAsync: jest.fn(async (req: unknown) => {
      mockScheduled.push(req)
      return `mock-${mockScheduled.length}`
    }),
    cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    setNotificationCategoryAsync: jest.fn(async () => undefined),
    setNotificationChannelAsync: jest.fn(async () => undefined),
  }
})

jest.mock('react-native-safe-area-context', () => {
  const React = require('react')
  return {
    __esModule: true,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  }
})

jest.mock('@react-native-async-storage/async-storage', () => require('./async-storage-mock').default)
