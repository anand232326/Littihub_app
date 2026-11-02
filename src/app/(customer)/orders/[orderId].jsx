import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { littiHubApi } from '../../../api/endpoints';
import { isDemoSession } from '../../../api/demoData';
import { useOrderTracking } from '../../../hooks/useOrderPolling';
import { OrderStepIndicator } from '../../../components/orders/OrderStepIndicator';
import { COLORS } from '../../../theme/colors';

export default function LiveOrderTrackingScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const orderQuery = useOrderTracking(orderId);
  const order = orderQuery.data;

  const cancelMutation = useMutation({
    mutationFn: () => littiHubApi.cancelOrder(orderId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['orders', orderId], updated);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Demo helper to advance status in Demo Mode so user can preview all 4 steps
  const advanceDemoStatusMutation = useMutation({
    mutationFn: async () => {
      const sequence =
        order?.order_type === 'pickup'
          ? ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up']
          : ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
      const idx = sequence.indexOf(order?.status);
      const nextStatus = sequence[Math.min(sequence.length - 1, idx + 1)];
      return await littiHubApi.updateOrderStatusAdmin(orderId, nextStatus);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['orders', orderId], updated);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleCancelOrder = () => {
    const msg = 'Are you sure you want to cancel this order?';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        cancelMutation.mutate();
      }
      return;
    }
    Alert.alert('Cancel Order?', msg, [
      { text: 'Keep Order', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => cancelMutation.mutate(),
      },
    ]);
  };

  if (orderQuery.isLoading || !order) {
    return (
      <SafeAreaView className="flex-1 bg-alabaster items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.brand} />
        <Text className="mt-2 text-xs font-medium text-slate-500">
          Fetching live order status...
        </Text>
      </SafeAreaView>
    );
  }

  // Customer Cancellation Guardrail (Section 4.3):
  // Customers can ONLY cancel while status is "pending" or "confirmed".
  const canCustomerCancel =
    order.status === 'pending' || order.status === 'confirmed';
  const isUnpaidPending =
    order.status === 'pending' && order.payment_status === 'pending';
  const isPreparingOrLater =
    order.status === 'preparing' ||
    order.status === 'out_for_delivery' ||
    order.status === 'ready_for_pickup';

  return (
    <SafeAreaView className="flex-1 bg-alabaster" edges={['top']}>
      {/* Top Bar */}
      <View className="px-5 pt-3 pb-3 bg-white border-b border-slate-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.replace('/(customer)/orders')}
            className="h-9 w-9 rounded-full bg-slate-100 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={18} color="#0F172A" />
          </Pressable>
          <View>
            <Text className="text-lg font-extrabold text-slate-900">
              Order #{order.id}
            </Text>
            <Text className="text-xs text-slate-500">
              {order.order_type === 'pickup'
                ? '🛍️ Self-Pickup Order'
                : '🛵 Home Delivery Order'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => orderQuery.refetch()}
          className="rounded-xl bg-slate-100 px-3 py-1.5 flex-row items-center"
        >
          <Ionicons name="refresh" size={14} color="#334155" />
          <Text className="ml-1 text-xs font-bold text-slate-700">Refresh</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* 1. Unpaid Order Recovery Banner (Section 4.3) */}
        {isUnpaidPending && (
          <View className="mb-4 rounded-3xl bg-brand p-5 shadow-sm">
            <Text className="text-base font-extrabold text-white">
              Complete Your Payment
            </Text>
            <Text className="text-xs text-orange-100 mt-1 mb-3">
              Your order is reserved but awaiting payment confirmation before
              the kitchen starts cooking.
            </Text>
            <Pressable
              onPress={() => router.push(`/(customer)/payment/${order.id}`)}
              className="rounded-xl bg-white py-3 items-center flex-row justify-center"
            >
              <Ionicons name="card" size={16} color={COLORS.brand} />
              <Text className="ml-2 text-xs font-extrabold text-brand">
                Complete Payment (₹{order.total_amount})
              </Text>
            </Pressable>
          </View>
        )}

        {/* 2. Dynamic 4-Step Visual Progress Tracker */}
        <View className="mb-4">
          <OrderStepIndicator
            status={order.status}
            orderType={order.order_type}
          />
        </View>

        {/* Demo Mode Simulator Button so user can test all 4 step transitions */}
        {isDemoSession() &&
          order.status !== 'pending' &&
          order.status !== 'cancelled' &&
          order.status !== 'delivered' &&
          order.status !== 'picked_up' && (
            <Pressable
              onPress={() => advanceDemoStatusMutation.mutate()}
              className="mb-4 rounded-2xl bg-sattu-light border border-amber-300 py-3 px-4 flex-row items-center justify-center"
            >
              <Ionicons name="sparkles" size={16} color="#B45309" />
              <Text className="ml-2 text-xs font-extrabold text-amber-900">
                ⚡ Simulate Next Kitchen Step (Demo Preview)
              </Text>
            </Pressable>
          )}

        {/* 3. Delivery Address / Pickup Info */}
        <View className="rounded-3xl bg-white p-4 border border-slate-200 mb-4 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            {order.order_type === 'pickup'
              ? 'Fulfillment Mode'
              : 'Delivery Address'}
          </Text>
          <Text className="text-sm font-bold text-slate-900">
            {order.order_type === 'pickup'
              ? 'Self-Pickup at Restaurant Counter'
              : order.delivery_address || 'Patna, Bihar'}
          </Text>
          {Boolean(order.transaction_id) && (
            <Text className="text-xs text-slate-500 mt-1.5">
              Transaction ID: {order.transaction_id} ({order.payment_status})
            </Text>
          )}
        </View>

        {/* 4. Itemized Order Summary */}
        <View className="rounded-3xl bg-white p-5 border border-slate-200 mb-4 shadow-sm">
          <Text className="text-sm font-extrabold text-slate-900 mb-3">
            Ordered Dishes
          </Text>

          {(order.items || []).map((item) => (
            <View
              key={item.menu_item_id}
              className="flex-row justify-between py-2 border-b border-slate-100"
            >
              <Text className="text-xs font-semibold text-slate-800 flex-1 pr-3">
                {item.quantity}x {item.name}
              </Text>
              <Text className="text-xs font-bold text-slate-900">
                ₹{item.total_price}
              </Text>
            </View>
          ))}

          <View className="mt-3 pt-2 flex-row justify-between">
            <Text className="text-xs text-slate-500">Subtotal</Text>
            <Text className="text-xs font-bold text-slate-800">
              ₹{order.subtotal}
            </Text>
          </View>
          <View className="mt-1 flex-row justify-between">
            <Text className="text-xs text-slate-500">Delivery Fee</Text>
            <Text className="text-xs font-bold text-slate-800">
              ₹{order.delivery_fee}
            </Text>
          </View>
          <View className="mt-2 pt-2 border-t border-slate-200 flex-row justify-between">
            <Text className="text-sm font-extrabold text-slate-900">
              Total Amount
            </Text>
            <Text className="text-base font-extrabold text-brand">
              ₹{order.total_amount}
            </Text>
          </View>
        </View>

        {/* 5. Customer Cancellation Guardrail (Section 4.3) */}
        {canCustomerCancel && (
          <Pressable
            onPress={handleCancelOrder}
            disabled={cancelMutation.isPending}
            className="rounded-2xl border border-spiced bg-white py-3.5 items-center justify-center"
          >
            <Text className="text-xs font-extrabold text-spiced">
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </Text>
          </Pressable>
        )}

        {isPreparingOrLater && (
          <View className="rounded-2xl bg-slate-100 px-4 py-3 flex-row items-center">
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#64748B"
            />
            <Text className="ml-2 text-xs text-slate-600 flex-1">
              Order is being prepared and can no longer be cancelled.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

