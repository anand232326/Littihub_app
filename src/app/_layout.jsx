import '../../global.css';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { COLORS } from '../theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15000,
    },
  },
});

function RoleBasedNavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { token, user, isHydrated, hydrateSession } = useAuthStore();
  const hydratePreferences = usePreferencesStore((s) => s.hydratePreferences);

  useEffect(() => {
    hydrateSession();
    hydratePreferences();
  }, [hydrateSession, hydratePreferences]);

  useEffect(() => {
    if (!isHydrated) return;

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(auth)';
    const inAdminGroup = rootSegment === '(admin)';
    const inCustomerGroup = rootSegment === '(customer)';

    if (!token || !user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    const isAdmin =
      user.role === 'restaurant_admin' || user.role === 'admin';

    if (isAdmin && !inAdminGroup) {
      router.replace('/(admin)/orders');
    } else if (!isAdmin && !inCustomerGroup) {
      router.replace('/(customer)');
    }
  }, [token, user, isHydrated, segments, router]);

  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-alabaster">
        <ActivityIndicator size="large" color={COLORS.brand} />
        <Text className="mt-3 text-sm font-medium text-slate-600">
          Loading LittiHub...
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <RoleBasedNavigationGuard />
    </QueryClientProvider>
  );
}
