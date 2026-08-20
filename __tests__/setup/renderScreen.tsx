/**
 * Renders a screen inside a real NavigationContainer + stack so that
 * useNavigation/useRoute resolve exactly as they do in the app.
 */
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const Stack = createStackNavigator();

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {retry: false, gcTime: 0, staleTime: Infinity},
      mutations: {retry: false},
    },
  });
}

type RenderOptions = {
  params?: object;
  name?: string;
};

/**
 * React elements passed as props (e.g. ScrollView's `refreshControl`) carry
 * internal fiber/profiler fields that change on every run. Strip them so
 * snapshots capture structure and style only.
 */
const VOLATILE_KEYS = new Set([
  'actualStartTime',
  'actualDuration',
  'selfBaseDuration',
  'treeBaseDuration',
  '_owner',
  '_store',
  '_debugInfo',
  '_debugOwner',
  '_debugStack',
  '_debugTask',
]);

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sanitize(item, seen));
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value as object)) {
    return '[Circular]';
  }
  seen.add(value as object);

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (VOLATILE_KEYS.has(key)) {
      continue;
    }
    out[key] = sanitize(item, seen);
  }
  return out;
}

/**
 * Returns the live renderer instance for structural assertions.
 * Callers are responsible for unmounting.
 */
export async function renderScreenInstance(
  Component: React.ComponentType<any>,
  {params, name = 'Target'}: RenderOptions = {},
): Promise<renderer.ReactTestRenderer> {
  const queryClient = createTestQueryClient();
  let tree: renderer.ReactTestRenderer | undefined;

  await act(async () => {
    tree = renderer.create(
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider
          initialMetrics={{
            frame: {x: 0, y: 0, width: 390, height: 844},
            insets: {top: 47, left: 0, right: 0, bottom: 34},
          }}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen
                name={name}
                component={Component}
                initialParams={params}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>,
    );
  });

  return tree!;
}

/**
 * Returns the serialized tree. Awaiting act() lets pending effects
 * (history preview loads, storage reads) settle before we snapshot.
 */
export async function renderScreen(
  Component: React.ComponentType<any>,
  {params, name = 'Target'}: RenderOptions = {},
): Promise<unknown> {
  const queryClient = createTestQueryClient();
  let tree: renderer.ReactTestRenderer | undefined;

  await act(async () => {
    tree = renderer.create(
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider
          initialMetrics={{
            frame: {x: 0, y: 0, width: 390, height: 844},
            insets: {top: 47, left: 0, right: 0, bottom: 34},
          }}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen
                name={name}
                component={Component}
                initialParams={params}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>,
    );
  });

  const json = tree!.toJSON();
  await act(async () => {
    tree!.unmount();
  });
  queryClient.clear();

  const root = Array.isArray(json) ? (json[0] ?? null) : json;
  return sanitize(root);
}
