import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FREE_DELIVERY_THRESHOLD = 500;

/**
 * Smart Free-Delivery Upsell & Pickup Progress Bar (Section 1 & 4.3)
 * OrderService charges ₹40 below ₹500 for delivery and ₹0 for >= ₹500 or pickup.
 */
export function FreeDeliveryBanner({ subtotal = 0, orderType = 'delivery' }) {
  if (orderType === 'pickup') {
    return (
      <View className="rounded-2xl bg-chutney-light border border-green-200 p-3.5 flex-row items-center">
        <Ionicons name="bag-check" size={20} color="#16A34A" />
        <View className="ml-2.5 flex-1">
          <Text className="text-xs font-bold text-chutney">
            Self-Pickup Selected • Zero Delivery Fee (Save ₹40!)
          </Text>
          <Text className="text-[11px] text-green-800 mt-0.5">
            Pick up your hot order directly from the restaurant counter.
          </Text>
        </View>
      </View>
    );
  }

  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progressPercent = Math.min(
    100,
    Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100)
  );
  const unlocked = remaining === 0 && subtotal > 0;

  return (
    <View
      className={`rounded-2xl border p-3.5 ${
        unlocked
          ? 'bg-chutney-light border-green-200'
          : 'bg-sattu-light border-amber-200'
      }`}
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center flex-1">
          <Ionicons
            name={unlocked ? 'checkmark-circle' : 'bicycle'}
            size={18}
            color={unlocked ? '#16A34A' : '#B45309'}
          />
          <Text
            className={`ml-2 text-xs font-bold flex-1 ${
              unlocked ? 'text-chutney' : 'text-amber-900'
            }`}
          >
            {unlocked
              ? '🎉 Hurray! You unlocked FREE Delivery (Saved ₹40)'
              : `Add ₹${remaining} more for FREE Delivery, or switch to Self-Pickup!`}
          </Text>
        </View>
        <Text className="text-[11px] font-extrabold text-slate-700 ml-2">
          {progressPercent}%
        </Text>
      </View>

      {/* Progress Bar Track */}
      <View className="h-2 w-full rounded-full bg-white/80 overflow-hidden">
        <View
          style={{ width: `${progressPercent}%` }}
          className={`h-full rounded-full ${
            unlocked ? 'bg-chutney' : 'bg-sattu'
          }`}
        />
      </View>
    </View>
  );
}

