import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DELIVERY_STEPS = [
  {
    key: 'confirmed',
    title: 'Order Confirmed',
    subtitle: 'Kitchen has received your order',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'preparing',
    title: 'Chef is Preparing Your Food',
    subtitle: 'Roasting fresh Littis over charcoal embers',
    icon: 'flame-outline',
  },
  {
    key: 'out_for_delivery',
    title: 'Out for Delivery',
    subtitle: 'Delivery partner is on the way to your address',
    icon: 'bicycle-outline',
  },
  {
    key: 'delivered',
    title: 'Delivered • Enjoy your Litti!',
    subtitle: 'Order delivered hot and fresh',
    icon: 'happy-outline',
  },
];

const PICKUP_STEPS = [
  {
    key: 'confirmed',
    title: 'Order Confirmed',
    subtitle: 'Kitchen has received your self-pickup order',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'preparing',
    title: 'Chef is Preparing Your Food',
    subtitle: 'Freshly preparing your dishes',
    icon: 'flame-outline',
  },
  {
    key: 'ready_for_pickup',
    title: 'Ready for Pickup at Counter!',
    subtitle: 'Head to the restaurant counter to collect your order',
    icon: 'bag-check-outline',
  },
  {
    key: 'picked_up',
    title: 'Picked Up • Enjoy your meal!',
    subtitle: 'Order collected from restaurant counter',
    icon: 'happy-outline',
  },
];

/**
 * Dynamic 4-Step Visual Order Stepper (Section 4.3 of frontend_system_design.md)
 * Adapts steps automatically for "delivery" vs "pickup" orders.
 */
export function OrderStepIndicator({ status, orderType = 'delivery' }) {
  if (status === 'cancelled') {
    return (
      <View className="rounded-3xl bg-spiced-light border border-red-200 p-5 flex-row items-center">
        <View className="h-11 w-11 rounded-2xl bg-spiced items-center justify-center mr-3.5">
          <Ionicons name="close-circle" size={24} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-extrabold text-spiced">
            Order Cancelled
          </Text>
          <Text className="text-xs text-red-800 mt-0.5">
            This order was cancelled before kitchen preparation started.
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'pending') {
    return (
      <View className="rounded-3xl bg-sattu-light border border-amber-300 p-5 flex-row items-center">
        <View className="h-11 w-11 rounded-2xl bg-sattu items-center justify-center mr-3.5">
          <Ionicons name="time" size={24} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-extrabold text-amber-900">
            Payment Pending
          </Text>
          <Text className="text-xs text-amber-800 mt-0.5">
            Complete your payment below so the kitchen can start preparing your
            order.
          </Text>
        </View>
      </View>
    );
  }

  const steps = orderType === 'pickup' ? PICKUP_STEPS : DELIVERY_STEPS;
  const activeIndex = steps.findIndex((s) => s.key === status);

  return (
    <View className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xs font-extrabold uppercase tracking-wider text-brand">
          Live {orderType === 'pickup' ? 'Self-Pickup' : 'Delivery'} Status
        </Text>
        <View className="flex-row items-center rounded-full bg-chutney-light px-2.5 py-1">
          <View className="h-2 w-2 rounded-full bg-chutney mr-1.5" />
          <Text className="text-[10px] font-extrabold text-chutney">
            Auto-updating every 5s
          </Text>
        </View>
      </View>

      {steps.map((step, index) => {
        const isCompleted = activeIndex > index || activeIndex === steps.length - 1;
        const isCurrent = activeIndex === index;
        const isLast = index === steps.length - 1;

        return (
          <View key={step.key} className="flex-row">
            {/* Step Circle & Connector Line */}
            <View className="items-center mr-3.5">
              <View
                className={`h-9 w-9 rounded-full items-center justify-center border-2 ${
                  isCompleted
                    ? 'bg-chutney border-chutney'
                    : isCurrent
                      ? 'bg-brand border-brand'
                      : 'bg-slate-100 border-slate-200'
                }`}
              >
                <Ionicons
                  name={isCompleted ? 'checkmark' : step.icon}
                  size={17}
                  color={isCompleted || isCurrent ? '#FFFFFF' : '#94A3B8'}
                />
              </View>
              {!isLast && (
                <View
                  className={`w-0.5 h-8 my-1 ${
                    activeIndex > index ? 'bg-chutney' : 'bg-slate-200'
                  }`}
                />
              )}
            </View>

            {/* Step Text */}
            <View className="flex-1 pt-1 pb-3">
              <Text
                className={`text-sm font-extrabold ${
                  isCurrent
                    ? 'text-brand'
                    : isCompleted
                      ? 'text-slate-900'
                      : 'text-slate-400'
                }`}
              >
                {step.title}
              </Text>
              <Text
                className={`text-xs mt-0.5 ${
                  isCurrent || isCompleted ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {step.subtitle}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

