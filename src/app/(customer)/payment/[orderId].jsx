import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { littiHubApi } from '../../../api/endpoints';
import { COLORS } from '../../../theme/colors';

const PAYMENT_METHODS = [
  {
    id: 'upi',
    title: 'UPI (GPay / PhonePe / Paytm)',
    subtitle: 'Instant payment via any UPI app • Recommended',
    icon: 'flash-outline',
    badge: 'Recommended',
  },
  {
    id: 'card',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, Mastercard, RuPay & Maestro cards',
    icon: 'card-outline',
  },
  {
    id: 'wallet',
    title: 'Mobile Wallets',
    subtitle: 'Amazon Pay, Paytm Wallet & Mobikwik',
    icon: 'wallet-outline',
  },
  {
    id: 'net_banking',
    title: 'Net Banking',
    subtitle: 'All major Indian banks supported',
    icon: 'business-outline',
  },
  {
    id: 'cod',
    title: 'Cash / Pay on Delivery',
    subtitle: 'Pay by cash or UPI QR at the time of fulfillment',
    icon: 'cash-outline',
  },
];

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [paymentError, setPaymentError] = useState('');

  const orderQuery = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => littiHubApi.getOrder(orderId),
    enabled: Boolean(orderId),
  });

  const payMutation = useMutation({
    mutationFn: () =>
      littiHubApi.payForOrder({
        order_id: orderId,
        payment_method: selectedMethod,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      router.replace(`/(customer)/orders/${orderId}`);
    },
    onError: (err) => {
      setPaymentError(err.message || 'Payment failed. Please try again.');
    },
  });

  const order = orderQuery.data;

  if (orderQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-alabaster items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-alabaster" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-3 pb-3 bg-white border-b border-slate-200 flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-extrabold text-slate-900">
            Select Payment Method
          </Text>
          <Text className="text-xs text-slate-500">
            Order #{orderId} •{' '}
            {order?.order_type === 'pickup' ? 'Self-Pickup' : 'Home Delivery'}
          </Text>
        </View>
        <View className="rounded-xl bg-brand-light px-3 py-1.5">
          <Text className="text-sm font-extrabold text-brand">
            ₹{order?.total_amount ?? 0}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {Boolean(paymentError) && (
          <View className="mb-4 rounded-2xl bg-spiced-light border border-red-200 p-3.5 flex-row items-center">
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text className="ml-2 flex-1 text-xs font-semibold text-spiced">
              {paymentError}
            </Text>
          </View>
        )}

        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <Pressable
              key={method.id}
              onPress={() => setSelectedMethod(method.id)}
              className={`mb-3 rounded-2xl p-4 border flex-row items-center ${
                isSelected
                  ? 'bg-white border-2 border-brand shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              <View
                className={`h-11 w-11 rounded-xl items-center justify-center mr-3.5 ${
                  isSelected ? 'bg-brand' : 'bg-slate-100'
                }`}
              >
                <Ionicons
                  name={method.icon}
                  size={20}
                  color={isSelected ? '#FFFFFF' : '#475569'}
                />
              </View>

              <View className="flex-1 pr-2">
                <View className="flex-row items-center">
                  <Text className="text-sm font-extrabold text-slate-900">
                    {method.title}
                  </Text>
                  {Boolean(method.badge) && (
                    <View className="ml-2 rounded-md bg-chutney-light px-2 py-0.5">
                      <Text className="text-[10px] font-bold text-chutney">
                        {method.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-slate-500 mt-0.5">
                  {method.subtitle}
                </Text>
              </View>

              <Ionicons
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={isSelected ? COLORS.brand : '#CBD5E1'}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Bottom Pay CTA */}
      <View className="p-4 bg-white border-t border-slate-200">
        <Pressable
          onPress={() => payMutation.mutate()}
          disabled={payMutation.isPending}
          className="rounded-2xl bg-chutney py-4 px-5 flex-row items-center justify-center shadow-sm active:opacity-90"
        >
          {payMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              <Text className="ml-2 text-base font-extrabold text-white">
                Pay ₹{order?.total_amount ?? 0} & Confirm Order
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

