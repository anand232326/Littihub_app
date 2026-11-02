import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Computes the next status transition and CTA button label/style
 * according to the LittiHub Order State Machine (Section 4.4).
 */
export function getNextKOTAction(order) {
  const isPickup = order.order_type === 'pickup';

  switch (order.status) {
    case 'confirmed':
      return {
        nextStatus: 'preparing',
        label: '🔥 Start Preparing',
        bgClass: 'bg-brand',
      };
    case 'preparing':
      return isPickup
        ? {
            nextStatus: 'ready_for_pickup',
            label: '🛍️ Mark Ready for Pickup',
            bgClass: 'bg-sattu',
          }
        : {
            nextStatus: 'out_for_delivery',
            label: '🛵 Dispatch for Delivery',
            bgClass: 'bg-sattu',
          };
    case 'ready_for_pickup':
      return {
        nextStatus: 'picked_up',
        label: '✅ Mark Picked Up',
        bgClass: 'bg-chutney',
      };
    case 'out_for_delivery':
      return {
        nextStatus: 'delivered',
        label: '✅ Mark Delivered',
        bgClass: 'bg-chutney',
      };
    default:
      return null;
  }
}

/**
 * 1-Tap Kitchen Order Ticket (KOT) Card for Restaurant Staff (Section 4.4)
 */
export function KOTOrderCard({ order, onAdvanceStatus, isUpdating }) {
  const action = getNextKOTAction(order);
  const isPickup = order.order_type === 'pickup';

  return (
    <View className="mb-4 rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
      {/* Ticket Header: Order ID + Fulfillment Type + Status */}
      <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
        <View className="flex-row items-center">
          <Text className="text-base font-extrabold text-slate-900 mr-2">
            #{order.id}
          </Text>
          <View
            className={`rounded-lg px-2.5 py-1 flex-row items-center ${
              isPickup ? 'bg-sattu-light' : 'bg-brand-light'
            }`}
          >
            <Ionicons
              name={isPickup ? 'bag-handle' : 'bicycle'}
              size={12}
              color={isPickup ? '#B45309' : '#D94E28'}
            />
            <Text
              className={`ml-1 text-[10px] font-extrabold uppercase ${
                isPickup ? 'text-amber-900' : 'text-brand'
              }`}
            >
              {isPickup ? 'Self-Pickup' : 'Delivery'}
            </Text>
          </View>
        </View>

        <View className="rounded-full bg-slate-100 px-3 py-1">
          <Text className="text-[11px] font-extrabold uppercase text-slate-700">
            {order.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* Itemized Kitchen Ticket Dishes */}
      <View className="py-3">
        {(order.items || []).map((item) => (
          <View
            key={item.menu_item_id}
            className="flex-row items-center justify-between py-1.5"
          >
            <View className="flex-row items-center flex-1 pr-3">
              <View className="h-6 w-6 rounded-md bg-brand-light items-center justify-center mr-2.5">
                <Text className="text-xs font-extrabold text-brand">
                  {item.quantity}x
                </Text>
              </View>
              <Text className="text-sm font-bold text-slate-900 flex-1">
                {item.name}
              </Text>
            </View>
            <Text className="text-xs font-bold text-slate-600">
              ₹{item.total_price}
            </Text>
          </View>
        ))}
      </View>

      {/* Address (if Delivery) + Total Bill */}
      <View className="pt-2.5 border-t border-slate-100 flex-row items-center justify-between mb-3">
        <View className="flex-1 pr-3">
          {!isPickup && Boolean(order.delivery_address) ? (
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text
                numberOfLines={1}
                className="ml-1 text-xs text-slate-500 flex-1"
              >
                {order.delivery_address}
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-slate-500">
              Counter Pickup • Payment: {order.payment_status}
            </Text>
          )}
        </View>
        <Text className="text-sm font-extrabold text-slate-900">
          ₹{order.total_amount}
        </Text>
      </View>

      {/* 1-Tap State Machine Advance Button */}
      {action ? (
        <Pressable
          onPress={() => onAdvanceStatus(order.id, action.nextStatus)}
          disabled={isUpdating}
          className={`rounded-2xl py-3.5 items-center justify-center shadow-sm active:opacity-90 ${action.bgClass}`}
        >
          {isUpdating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-sm font-extrabold text-white">
              {action.label}
            </Text>
          )}
        </Pressable>
      ) : (
        <View className="rounded-xl bg-slate-100 py-2.5 items-center">
          <Text className="text-xs font-bold text-slate-500 uppercase">
            Order {order.status.replace(/_/g, ' ')}
          </Text>
        </View>
      )}
    </View>
  );
}

