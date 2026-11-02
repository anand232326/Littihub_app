import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../hooks/useCart';

/**
 * Persistent Floating Bottom Cart Bar (Section 1 & 4.2)
 * Appears whenever cart.total_items > 0, displaying item count, subtotal,
 * free delivery upsell hint, and 1-tap navigation to Checkout.
 */
export function FloatingCartBar() {
  const router = useRouter();
  const { cart } = useCart();

  if (!cart || !cart.total_items || cart.total_items <= 0) {
    return null;
  }

  const remainingForFreeDelivery = Math.max(0, 500 - (cart.subtotal || 0));

  return (
    <View className="px-4 pb-3 pt-1">
      <Pressable
        onPress={() => router.push('/(customer)/checkout')}
        className="rounded-2xl bg-brand px-4 py-3.5 shadow-lg flex-row items-center justify-between active:opacity-95"
      >
        <View>
          <View className="flex-row items-center">
            <View className="rounded-lg bg-white/20 px-2 py-0.5 mr-2">
              <Text className="text-xs font-extrabold text-white">
                {cart.total_items} {cart.total_items === 1 ? 'Item' : 'Items'}
              </Text>
            </View>
            <Text className="text-base font-extrabold text-white">
              ₹{cart.subtotal}
            </Text>
          </View>
          <Text className="text-[11px] font-medium text-orange-100 mt-0.5">
            {remainingForFreeDelivery > 0
              ? `Add ₹${remainingForFreeDelivery} more for FREE delivery`
              : '🎉 FREE Delivery unlocked on this order!'}
          </Text>
        </View>

        <View className="flex-row items-center rounded-xl bg-white px-3.5 py-2">
          <Text className="text-xs font-extrabold text-brand mr-1">
            View Cart
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#D94E28" />
        </View>
      </Pressable>
    </View>
  );
}

