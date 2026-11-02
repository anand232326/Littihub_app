import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Standard Indian Food-Delivery Veg / Non-Veg Icon Badge
 * Green square + circle for Vegetarian; Red square + triangle/circle for Non-Veg.
 */
function DietaryBadge({ isVegetarian }) {
  const colorClass = isVegetarian ? 'border-chutney' : 'border-spiced';
  const dotClass = isVegetarian ? 'bg-chutney' : 'bg-spiced';

  return (
    <View
      className={`h-4 w-4 items-center justify-center rounded-sm border ${colorClass}`}
    >
      <View className={`h-2 w-2 rounded-full ${dotClass}`} />
    </View>
  );
}

/**
 * MenuItemCard Component (Section 4.2 of frontend_system_design.md)
 * - Displays Veg/Non-Veg indicator, prep time badge, price, and description
 * - Shows "Sold Out" when item.is_available === false
 * - Renders [ + ADD ] when quantity === 0, or optimistic [ - | qty | + ] stepper
 */
export function MenuItemCard({
  item,
  quantity = 0,
  isRestaurantOpen = true,
  onAdd,
  onIncrement,
  onDecrement,
}) {
  const isAvailable = item.is_available !== false;

  const handleIncrementPress = () => {
    if (quantity >= 20) {
      const msg = 'Maximum 20 items allowed per dish.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Limit Reached', msg);
      }
      return;
    }
    onIncrement?.();
  };

  return (
    <View
      className={`mb-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm flex-row justify-between ${
        !isAvailable ? 'opacity-60' : ''
      }`}
    >
      {/* Left Column: Dietary Badge, Prep Time, Title, Price, Description */}
      <View className="flex-1 pr-4">
        <View className="flex-row items-center gap-2 mb-1.5">
          <DietaryBadge isVegetarian={item.is_vegetarian} />
          {Boolean(item.preparation_time_minutes) && (
            <View className="flex-row items-center rounded-md bg-sattu-light px-2 py-0.5">
              <Ionicons name="time-outline" size={11} color="#B45309" />
              <Text className="ml-1 text-[10px] font-bold text-amber-800">
                {item.preparation_time_minutes} mins
              </Text>
            </View>
          )}
          {!isAvailable && (
            <View className="rounded-md bg-slate-200 px-2 py-0.5">
              <Text className="text-[10px] font-bold uppercase text-slate-600">
                Sold Out
              </Text>
            </View>
          )}
        </View>

        <Text className="text-base font-bold text-slate-900">{item.name}</Text>
        <Text className="mt-0.5 text-sm font-extrabold text-slate-800">
          ₹{item.price}
        </Text>

        {Boolean(item.description) && (
          <Text
            numberOfLines={2}
            className="mt-1.5 text-xs text-slate-500 leading-4"
          >
            {item.description}
          </Text>
        )}
      </View>

      {/* Right Column: Visual Dish Placeholder & Stepper Control */}
      <View className="items-center justify-between w-28">
        <View className="h-20 w-24 rounded-xl bg-brand-light border border-brand/15 items-center justify-center mb-2">
          <Ionicons
            name={item.is_vegetarian ? 'leaf-outline' : 'flame-outline'}
            size={26}
            color="#D94E28"
          />
        </View>

        {!isAvailable ? (
          <View className="w-24 rounded-xl bg-slate-100 border border-slate-200 py-2 items-center">
            <Text className="text-xs font-bold text-slate-400">Unavailable</Text>
          </View>
        ) : !isRestaurantOpen ? (
          <View className="w-24 rounded-xl bg-slate-100 border border-slate-200 py-2 items-center">
            <Text className="text-[11px] font-bold text-slate-500">Closed</Text>
          </View>
        ) : quantity === 0 ? (
          <Pressable
            onPress={onAdd}
            className="w-24 rounded-xl bg-white border-2 border-brand py-1.5 items-center justify-center shadow-sm active:bg-brand-light"
          >
            <Text className="text-xs font-extrabold text-brand uppercase tracking-wide">
              + ADD
            </Text>
          </Pressable>
        ) : (
          <View className="w-24 flex-row items-center justify-between rounded-xl bg-brand px-2 py-1.5 shadow-sm">
            <Pressable
              onPress={onDecrement}
              hitSlop={8}
              className="h-6 w-6 items-center justify-center rounded-lg active:bg-brand-dark"
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </Pressable>

            <Text className="text-xs font-extrabold text-white">
              {quantity}
            </Text>

            <Pressable
              onPress={handleIncrementPress}
              hitSlop={8}
              className="h-6 w-6 items-center justify-center rounded-lg active:bg-brand-dark"
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

