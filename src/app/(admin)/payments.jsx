import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { littiHubApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

export default function AdminPaymentsFinanceScreen() {
  const queryClient = useQueryClient();
  const activeRestaurantId =
    useAuthStore((s) => s.activeRestaurantId) || 'rest_patna_01';

  const paymentsQuery = useQuery({
    queryKey: ['admin-payments', activeRestaurantId],
    queryFn: () => littiHubApi.listRestaurantPaymentsAdmin(activeRestaurantId),
  });

  const refundMutation = useMutation({
    mutationFn: (paymentId) => littiHubApi.refundPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-payments', activeRestaurantId],
      });
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
    },
  });

  const payments = Array.isArray(paymentsQuery.data)
    ? paymentsQuery.data
    : paymentsQuery.data?.items || [];

  const totalCollected = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalRefunded = payments
    .filter((p) => p.status === 'refunded')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleRefundPress = (payment) => {
    const msg = `Issue a full refund of ₹${payment.amount} for Order #${payment.order_id}?`;
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        refundMutation.mutate(payment.id);
      }
      return;
    }
    Alert.alert('Confirm Refund', msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Issue Refund',
        style: 'destructive',
        onPress: () => refundMutation.mutate(payment.id),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-alabaster" edges={['top']}>
      <View className="px-5 pt-3 pb-3 bg-white border-b border-slate-200">
        <Text className="text-xl font-extrabold text-slate-900">
          Store Finance & Refunds
        </Text>
        <Text className="text-xs text-slate-500">
          Live settlement ledger & 1-tap customer refunds
        </Text>
      </View>

      {/* Revenue Summary Cards */}
      <View className="px-5 pt-4 pb-2 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
          <Text className="text-[11px] font-bold uppercase text-slate-400">
            Net Collected
          </Text>
          <Text className="text-xl font-extrabold text-chutney mt-1">
            ₹{totalCollected}
          </Text>
        </View>

        <View className="flex-1 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
          <Text className="text-[11px] font-bold uppercase text-slate-400">
            Total Refunded
          </Text>
          <Text className="text-xl font-extrabold text-spiced mt-1">
            ₹{totalRefunded}
          </Text>
        </View>
      </View>

      {paymentsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={paymentsQuery.isRefetching}
              onRefresh={() => paymentsQuery.refetch()}
              tintColor={COLORS.brand}
            />
          }
          renderItem={({ item }) => {
            const isCompleted = item.status === 'completed';
            return (
              <View className="mb-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-sm font-extrabold text-slate-900">
                      Order #{item.order_id}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {item.transaction_id} •{' '}
                      {(item.payment_method || 'upi').toUpperCase()}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-base font-extrabold text-slate-900">
                      ₹{item.amount}
                    </Text>
                    <View
                      className={`rounded-md px-2 py-0.5 mt-0.5 ${
                        isCompleted ? 'bg-chutney-light' : 'bg-spiced-light'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-extrabold uppercase ${
                          isCompleted ? 'text-chutney' : 'text-spiced'
                        }`}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {isCompleted && (
                  <Pressable
                    onPress={() => handleRefundPress(item)}
                    disabled={refundMutation.isPending}
                    className="mt-2 rounded-xl bg-spiced-light border border-red-200 py-2.5 flex-row items-center justify-center"
                  >
                    <Ionicons
                      name="return-up-back-outline"
                      size={15}
                      color="#DC2626"
                    />
                    <Text className="ml-1.5 text-xs font-extrabold text-spiced">
                      Refund Payment (₹{item.amount})
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="mt-10 rounded-3xl bg-white p-8 items-center border border-slate-200">
              <Ionicons name="wallet-outline" size={38} color="#94A3B8" />
              <Text className="mt-2 text-base font-bold text-slate-800">
                No transactions found
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
