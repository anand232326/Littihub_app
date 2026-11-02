import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { littiHubApi } from '../../../api/endpoints';
import { useAuthStore } from '../../../store/authStore';
import { COLORS } from '../../../theme/colors';

const STATUS_BADGE = {
  pending: { label: 'Payment Pending', bg: 'bg-sattu-light', text: 'text-amber-800' },
  confirmed: { label: 'Confirmed', bg: 'bg-brand-light', text: 'text-brand' },
  preparing: { label: 'Preparing', bg: 'bg-sattu-light', text: 'text-amber-900' },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-brand-light', text: 'text-brand' },
  ready_for_pickup: { label: 'Ready for Pickup', bg: 'bg-chutney-light', text: 'text-chutney' },
  delivered: { label: 'Delivered', bg: 'bg-chutney-light', text: 'text-chutney' },
  picked_up: { label: 'Picked Up', bg: 'bg-chutney-light', text: 'text-chutney' },
  cancelled: { label: 'Cancelled', bg: 'bg-spiced-light', text: 'text-spiced' },
};

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => littiHubApi.listMyOrders({ page: 1, page_size: 20 }),
    enabled: Boolean(token),
  });

  const orders = ordersQuery.data?.items || ordersQuery.data || [];

  const renderOrderCard = ({ item }) => {
    const badge = STATUS_BADGE[item.status] || STATUS_BADGE.confirmed;
    const isUnpaid =
      item.status === 'pending' && item.payment_status === 'pending';

    return (
      <Pressable
        onPress={() => router.push(`/(customer)/orders/${item.id}`)}
        className="mb-4 rounded-3xl bg-white p-5 border border-slate-200 shadow-sm active:opacity-95"
      >
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center">
            <Text className="text-base font-extrabold text-slate-900 mr-2">
              Order #{item.id}
            </Text>
            <View className="rounded-md bg-slate-100 px-2 py-0.5">
              <Text className="text-[10px] font-bold uppercase text-slate-600">
                {item.order_type}
              </Text>
            </View>
          </View>

          <View className={`rounded-full px-3 py-1 ${badge.bg}`}>
            <Text className={`text-[11px] font-extrabold ${badge.text}`}>
              {badge.label}
            </Text>
          </View>
        </View>

        {/* Items Summary */}
        <Text numberOfLines={2} className="text-xs text-slate-600 mb-3">
          {(item.items || [])
            .map((i) => `${i.quantity}x ${i.name}`)
            .join(', ')}
        </Text>

        <View className="pt-3 border-t border-slate-100 flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-slate-900">
            Total: ₹{item.total_amount}
          </Text>

          {isUnpaid ? (
            <Pressable
              onPress={() => router.push(`/(customer)/payment/${item.id}`)}
              className="rounded-xl bg-brand px-3.5 py-2 flex-row items-center"
            >
              <Ionicons name="card-outline" size={14} color="#FFFFFF" />
              <Text className="ml-1.5 text-xs font-extrabold text-white">
                Complete Payment (₹{item.total_amount})
              </Text>
            </Pressable>
          ) : (
            <View className="flex-row items-center">
              <Text className="text-xs font-extrabold text-brand mr-1">
                Track Live Status
              </Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.brand} />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-alabaster" edges={['top']}>
      <View className="px-5 pt-3 pb-3">
        <Text className="text-2xl font-extrabold text-slate-900">
          My Orders
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5">
          Track active orders in real time or complete pending payments
        </Text>
      </View>

      {ordersQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={{
            paddingHorizontal: 20,
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
            <View className="mt-12 rounded-3xl bg-white p-8 items-center border border-slate-200">
              <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
              <Text className="mt-3 text-base font-bold text-slate-800">
                No orders yet
              </Text>
              <Text className="mt-1 text-xs text-slate-500 text-center">
                Place your first Litti Chokha order from the Explore tab!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
