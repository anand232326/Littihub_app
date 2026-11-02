import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { littiHubApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { useAuthActions } from '../../hooks/useAuth';
import { KOTOrderCard } from '../../components/admin/KOTOrderCard';
import { COLORS } from '../../theme/colors';

const STATUS_TABS = [
  { id: 'ACTIVE', label: 'Active Queue' },
  { id: 'confirmed', label: 'New (Confirmed)' },
  { id: 'preparing', label: 'Cooking' },
  { id: 'READY_OUT', label: 'Ready / Out' },
  { id: 'HISTORY', label: 'Completed' },
];

export default function AdminLiveKOTScreen() {
  const queryClient = useQueryClient();
  const { activeRestaurantId, setActiveRestaurantId } = useAuthStore();
  const { logout } = useAuthActions();

  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'delivery' | 'pickup'

  // 1. Fetch restaurants to select active kitchen & read open/close status
  const restaurantsQuery = useQuery({
    queryKey: ['restaurants-admin'],
    queryFn: () => littiHubApi.listRestaurants({ page: 1, page_size: 20 }),
  });

  const restaurants = restaurantsQuery.data?.items || [];
  const currentRestaurant =
    restaurants.find((r) => r.id === activeRestaurantId) || restaurants[0];

  useEffect(() => {
    if (!activeRestaurantId && restaurants.length > 0) {
      setActiveRestaurantId(restaurants[0].id);
    }
  }, [activeRestaurantId, restaurants, setActiveRestaurantId]);

  // 2. Poll Kitchen Orders every 5 seconds (Section 4.4)
  const ordersQuery = useQuery({
    queryKey: ['admin-orders', currentRestaurant?.id],
    queryFn: () =>
      littiHubApi.listRestaurantOrdersAdmin(currentRestaurant?.id),
    enabled: Boolean(currentRestaurant?.id),
    refetchInterval: 5000,
  });

  // 3. Global Store Open / Closed Switch Mutation
  const toggleOpenMutation = useMutation({
    mutationFn: (nextOpen) =>
      littiHubApi.toggleRestaurantOpenStatus(currentRestaurant.id, nextOpen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants-admin'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  // 4. 1-Tap Order Status Transition Mutation
  const advanceStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) =>
      littiHubApi.updateOrderStatusAdmin(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-orders', currentRestaurant?.id],
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const allOrders =
    ordersQuery.data?.items ||
    (Array.isArray(ordersQuery.data) ? ordersQuery.data : []);

  const filteredOrders = allOrders.filter((order) => {
    if (typeFilter !== 'ALL' && order.order_type !== typeFilter) {
      return false;
    }
    if (statusFilter === 'ACTIVE') {
      return ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(
        order.status
      );
    }
    if (statusFilter === 'READY_OUT') {
      return ['ready_for_pickup', 'out_for_delivery'].includes(order.status);
    }
    if (statusFilter === 'HISTORY') {
      return ['delivered', 'picked_up', 'cancelled'].includes(order.status);
    }
    return order.status === statusFilter;
  });

  const isStoreOpen = currentRestaurant?.is_open !== false;

  return (
    <SafeAreaView className="flex-1 bg-alabaster" edges={['top']}>
      {/* Top Partner Header & Store Open/Closed Toggle */}
      <View className="px-5 pt-3 pb-3 bg-white border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-extrabold uppercase tracking-wider text-brand">
              Kitchen Order Console (5s Live Sync)
            </Text>
            <Text
              numberOfLines={1}
              className="text-xl font-extrabold text-slate-900"
            >
              {currentRestaurant?.name || 'LittiHub Partner Kitchen'}
            </Text>
          </View>

          <Pressable
            onPress={logout}
            className="rounded-xl bg-slate-100 px-3 py-2 flex-row items-center"
          >
            <Ionicons name="log-out-outline" size={16} color="#DC2626" />
            <Text className="ml-1 text-xs font-bold text-spiced">Exit</Text>
          </Pressable>
        </View>

        {/* Global Store Open / Closed Toggle Bar */}
        {Boolean(currentRestaurant) && (
          <View
            className={`rounded-2xl p-3 border flex-row items-center justify-between mb-3 ${
              isStoreOpen
                ? 'bg-chutney-light border-green-200'
                : 'bg-spiced-light border-red-200'
            }`}
          >
            <View className="flex-row items-center flex-1 pr-3">
              <View
                className={`h-3 w-3 rounded-full mr-2.5 ${
                  isStoreOpen ? 'bg-chutney' : 'bg-spiced'
                }`}
              />
              <View>
                <Text
                  className={`text-xs font-extrabold ${
                    isStoreOpen ? 'text-chutney' : 'text-spiced'
                  }`}
                >
                  {isStoreOpen
                    ? '🟢 Store is OPEN & Accepting Orders'
                    : '🔴 Store is CLOSED (Orders Paused)'}
                </Text>
                <Text className="text-[11px] text-slate-600">
                  {currentRestaurant.address}, {currentRestaurant.city}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => toggleOpenMutation.mutate(!isStoreOpen)}
              disabled={toggleOpenMutation.isPending}
              className={`rounded-xl px-3.5 py-2 ${
                isStoreOpen ? 'bg-spiced' : 'bg-chutney'
              }`}
            >
              <Text className="text-xs font-extrabold text-white">
                {isStoreOpen ? 'Close Store' : 'Open Store'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Status Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          className="mb-2.5"
        >
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setStatusFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 border ${
                  active
                    ? 'bg-brand border-brand'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    active ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Fulfillment Type Filter Chips (All vs Delivery vs Self-Pickup) */}
        <View className="flex-row gap-2">
          {[
            { id: 'ALL', label: 'All Types' },
            { id: 'delivery', label: '🛵 Delivery' },
            { id: 'pickup', label: '🛍️ Self-Pickup' },
          ].map((t) => {
            const active = typeFilter === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTypeFilter(t.id)}
                className={`rounded-xl px-3 py-1.5 border ${
                  active
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    active ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* KOT Cards Queue */}
      {ordersQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <KOTOrderCard
              order={item}
              isUpdating={advanceStatusMutation.isPending}
              onAdvanceStatus={(orderId, status) =>
                advanceStatusMutation.mutate({ orderId, status })
              }
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={ordersQuery.isRefetching}
              onRefresh={() => ordersQuery.refetch()}
              tintColor={COLORS.brand}
            />
          }
          ListEmptyComponent={
            <View className="mt-10 rounded-3xl bg-white p-8 items-center border border-slate-200">
              <Ionicons name="checkmark-done-circle" size={42} color="#16A34A" />
              <Text className="mt-3 text-base font-bold text-slate-800">
                No tickets in this queue
              </Text>
              <Text className="mt-1 text-xs text-slate-500 text-center">
                New incoming orders automatically appear here every 5 seconds.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
