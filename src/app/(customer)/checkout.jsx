import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { littiHubApi } from '../../api/endpoints';
import { CART_QUERY_KEY, useCart } from '../../hooks/useCart';
import { usePreferencesStore } from '../../store/preferencesStore';
import { FreeDeliveryBanner } from '../../components/cart/FreeDeliveryBanner';
import { COLORS } from '../../theme/colors';

export default function CheckoutScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { cart, updateQuantity, clearCartSafely } = useCart();
  const {
    orderType,
    setOrderType,
    deliveryAddress,
    setDeliveryAddress,
    savedAddresses,
    addSavedAddress,
    getOrCreateIdempotencyKey,
    clearCheckoutIdempotencyKey,
  } = usePreferencesStore();

  const [checkoutError, setCheckoutError] = useState('');

  const restaurantQuery = useQuery({
    queryKey: ['restaurant', cart?.restaurant_id],
    queryFn: () => littiHubApi.getRestaurant(cart.restaurant_id),
    enabled: Boolean(cart?.restaurant_id),
  });

  const restaurant = restaurantQuery.data;
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const deliveryFee =
    orderType === 'pickup' || subtotal >= 500 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const trimmedAddress = deliveryAddress.trim();
      const payload = {
        restaurant_id: cart.restaurant_id,
        order_type: orderType,
        ...(orderType === 'delivery'
          ? { delivery_address: trimmedAddress }
          : {}),
      };

      // Deterministic Idempotency-Key per unique checkout draft (Section 4.3)
      const payloadSignature = JSON.stringify({
        ...payload,
        items: items.map((i) => ({ id: i.menu_item_id, q: i.quantity })),
      });
      const idempotencyKey = getOrCreateIdempotencyKey(payloadSignature);

      return await littiHubApi.createOrder({ payload, idempotencyKey });
    },
    onSuccess: (createdOrder) => {
      clearCheckoutIdempotencyKey();
      // Backend clears Redis cart upon order creation; sync client cache
      queryClient.setQueryData(CART_QUERY_KEY, {
        user_id: cart?.user_id || '',
        restaurant_id: null,
        items: [],
        subtotal: 0,
        total_items: 0,
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      router.replace(`/(customer)/payment/${createdOrder.id}`);
    },
    onError: (err) => {
      setCheckoutError(
        err.message || 'Could not create order. Tap Retry to safely try again.'
      );
    },
  });

  const handleProceedToPay = () => {
    setCheckoutError('');

    if (!cart?.restaurant_id || items.length === 0) {
      setCheckoutError('Your cart is empty. Add some delicious Littis first!');
      return;
    }

    if (orderType === 'delivery') {
      const trimmed = deliveryAddress.trim();
      if (trimmed.length < 5 || trimmed.length > 500) {
        setCheckoutError(
          'Please enter a complete delivery address (minimum 5 characters).'
        );
        return;
      }
      addSavedAddress(trimmed);
    }

    createOrderMutation.mutate();
  };

  if (!items.length) {
    return (
      <SafeAreaView className="flex-1 bg-alabaster px-6 items-center justify-center">
        <View className="h-20 w-20 rounded-full bg-brand-light items-center justify-center mb-4">
          <Ionicons name="cart-outline" size={38} color={COLORS.brand} />
        </View>
        <Text className="text-xl font-extrabold text-slate-900">
          Your Cart is Empty
        </Text>
        <Text className="mt-1.5 text-xs text-slate-500 text-center max-w-xs">
          Explore restaurants near you and add hot Desi Ghee Littis to your
          cart!
        </Text>
        <Pressable
          onPress={() => router.replace('/(customer)')}
          className="mt-6 rounded-xl bg-brand px-6 py-3.5"
        >
          <Text className="text-sm font-bold text-white">
            Browse Restaurants
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-alabaster" edges={['top']}>
      {/* Top Bar */}
      <View className="px-5 pt-3 pb-3 bg-white border-b border-slate-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 rounded-full bg-slate-100 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={18} color="#0F172A" />
          </Pressable>
          <View>
            <Text className="text-lg font-extrabold text-slate-900">
              Cart & Checkout
            </Text>
            <Text className="text-xs text-slate-500">
              {restaurant?.name || 'Selected Restaurant'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={clearCartSafely}
          className="rounded-xl bg-spiced-light px-3 py-1.5"
        >
          <Text className="text-xs font-bold text-spiced">Clear Cart</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Fulfillment Mode Segmented Control (Delivery vs Self-Pickup) */}
        <View className="rounded-2xl bg-white p-1.5 border border-slate-200 flex-row mb-4">
          <Pressable
            onPress={() => setOrderType('delivery')}
            className={`flex-1 rounded-xl py-2.5 flex-row items-center justify-center ${
              orderType === 'delivery' ? 'bg-brand' : 'bg-transparent'
            }`}
          >
            <Ionicons
              name="bicycle"
              size={16}
              color={orderType === 'delivery' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              className={`ml-2 text-xs font-extrabold ${
                orderType === 'delivery' ? 'text-white' : 'text-slate-600'
              }`}
            >
              🛵 Home Delivery
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setOrderType('pickup')}
            className={`flex-1 rounded-xl py-2.5 flex-row items-center justify-center ${
              orderType === 'pickup' ? 'bg-brand' : 'bg-transparent'
            }`}
          >
            <Ionicons
              name="bag-handle"
              size={16}
              color={orderType === 'pickup' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              className={`ml-2 text-xs font-extrabold ${
                orderType === 'pickup' ? 'text-white' : 'text-slate-600'
              }`}
            >
              🛍️ Self-Pickup (₹0 Fee)
            </Text>
          </Pressable>
        </View>

        {/* 2. Smart Free-Delivery Upsell Progress Banner */}
        <View className="mb-4">
          <FreeDeliveryBanner subtotal={subtotal} orderType={orderType} />
        </View>

        {/* 3. Delivery Address Input OR Self-Pickup Counter Card */}
        {orderType === 'delivery' ? (
          <View className="rounded-3xl bg-white p-4 border border-slate-200 mb-4 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name="location" size={18} color={COLORS.brand} />
              <Text className="ml-1.5 text-sm font-extrabold text-slate-900">
                Delivery Address
              </Text>
            </View>

            <TextInput
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="House/Flat No., Landmark, Road, City & Pincode..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 mb-3"
            />

            {savedAddresses.length > 0 && (
              <View>
                <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Quick Select Saved Address
                </Text>
                {savedAddresses.map((addr) => {
                  const isSelected = deliveryAddress === addr;
                  return (
                    <Pressable
                      key={addr}
                      onPress={() => setDeliveryAddress(addr)}
                      className={`mb-1.5 rounded-xl border px-3 py-2 flex-row items-center ${
                        isSelected
                          ? 'bg-brand-light border-brand'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Ionicons
                        name={
                          isSelected ? 'radio-button-on' : 'radio-button-off'
                        }
                        size={14}
                        color={isSelected ? COLORS.brand : '#94A3B8'}
                      />
                      <Text
                        numberOfLines={1}
                        className={`ml-2 text-xs flex-1 ${
                          isSelected
                            ? 'font-bold text-brand'
                            : 'text-slate-600'
                        }`}
                      >
                        {addr}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View className="rounded-3xl bg-white p-4 border border-slate-200 mb-4 shadow-sm flex-row items-center">
            <View className="h-11 w-11 rounded-2xl bg-brand-light items-center justify-center mr-3">
              <Ionicons name="storefront" size={22} color={COLORS.brand} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-wider text-brand">
                Pickup Counter Address
              </Text>
              <Text className="text-sm font-extrabold text-slate-900 mt-0.5">
                {restaurant?.name || 'LittiHub Partner Kitchen'}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {restaurant?.address}, {restaurant?.city} {restaurant?.pincode}
              </Text>
            </View>
          </View>
        )}

        {/* 4. Cart Items List with Optimistic Steppers */}
        <View className="rounded-3xl bg-white p-4 border border-slate-200 mb-4 shadow-sm">
          <Text className="text-sm font-extrabold text-slate-900 mb-3">
            Order Items ({cart?.total_items || 0})
          </Text>

          {items.map((item) => (
            <View
              key={item.menu_item_id}
              className="py-3 border-b border-slate-100 flex-row items-center justify-between"
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-slate-900">
                  {item.name}
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  ₹{item.price} each
                </Text>
              </View>

              <View className="flex-row items-center">
                <View className="flex-row items-center rounded-xl bg-brand px-2 py-1 mr-3">
                  <Pressable
                    onPress={() =>
                      updateQuantity({
                        menu_item_id: item.menu_item_id,
                        quantity: item.quantity - 1,
                      })
                    }
                    className="h-6 w-6 items-center justify-center"
                  >
                    <Ionicons name="remove" size={14} color="#FFFFFF" />
                  </Pressable>
                  <Text className="mx-2 text-xs font-extrabold text-white">
                    {item.quantity}
                  </Text>
                  <Pressable
                    onPress={() =>
                      updateQuantity({
                        menu_item_id: item.menu_item_id,
                        quantity: item.quantity + 1,
                      })
                    }
                    className="h-6 w-6 items-center justify-center"
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>

                <Text className="w-14 text-right text-sm font-extrabold text-slate-900">
                  ₹{item.total_price}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 5. Transparent Bill Summary Card */}
        <View className="rounded-3xl bg-white p-5 border border-slate-200 mb-4 shadow-sm">
          <Text className="text-sm font-extrabold text-slate-900 mb-3">
            Bill Summary
          </Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-slate-600">Item Subtotal</Text>
            <Text className="text-xs font-bold text-slate-900">
              ₹{subtotal}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3 pb-3 border-b border-slate-100">
            <Text className="text-xs text-slate-600">
              {orderType === 'pickup'
                ? 'Self-Pickup Fee'
                : 'Delivery Partner Fee'}
            </Text>
            {orderType === 'pickup' ? (
              <Text className="text-xs font-extrabold text-chutney">
                ₹0 (Self-Pickup)
              </Text>
            ) : subtotal >= 500 ? (
              <View className="flex-row items-center">
                <Text className="text-xs text-slate-400 line-through mr-1.5">
                  ₹40
                </Text>
                <Text className="text-xs font-extrabold text-chutney">
                  FREE
                </Text>
              </View>
            ) : (
              <Text className="text-xs font-bold text-slate-900">₹40</Text>
            )}
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-base font-extrabold text-slate-900">
              To Pay
            </Text>
            <Text className="text-lg font-extrabold text-brand">
              ₹{grandTotal}
            </Text>
          </View>
        </View>

        {Boolean(checkoutError) && (
          <View className="mb-4 rounded-2xl bg-spiced-light border border-red-200 p-3.5 flex-row items-center">
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text className="ml-2 flex-1 text-xs font-semibold text-spiced">
              {checkoutError}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Proceed to Pay CTA */}
      <View className="p-4 bg-white border-t border-slate-200">
        <Pressable
          onPress={handleProceedToPay}
          disabled={createOrderMutation.isPending}
          className="rounded-2xl bg-brand py-4 px-5 flex-row items-center justify-between shadow-sm active:opacity-90"
        >
          <View>
            <Text className="text-xs font-semibold text-orange-100">
              Total Payable
            </Text>
            <Text className="text-lg font-extrabold text-white">
              ₹{grandTotal}
            </Text>
          </View>

          {createOrderMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View className="flex-row items-center">
              <Text className="text-base font-extrabold text-white mr-2">
                Proceed to Pay
              </Text>
              <Ionicons name="arrow-forward-circle" size={22} color="#FFFFFF" />
            </View>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
