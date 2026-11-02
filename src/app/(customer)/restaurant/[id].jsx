import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { littiHubApi } from '../../../api/endpoints';
import { useCart } from '../../../hooks/useCart';
import { usePreferencesStore } from '../../../store/preferencesStore';
import { MenuItemCard } from '../../../components/menu/MenuItemCard';
import { FloatingCartBar } from '../../../components/cart/FloatingCartBar';
import { COLORS } from '../../../theme/colors';

export default function RestaurantStorefrontScreen() {
  const { id: restaurantId } = useLocalSearchParams();
  const router = useRouter();

  const { itemMap, handleAddItem, updateQuantity } = useCart();
  const { vegOnly, setVegOnly } = usePreferencesStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [dishSearch, setDishSearch] = useState('');

  const restaurantQuery = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => littiHubApi.getRestaurant(restaurantId),
    enabled: Boolean(restaurantId),
  });

  const menuQuery = useQuery({
    queryKey: ['restaurant-menu', restaurantId],
    queryFn: () => littiHubApi.getRestaurantMenu(restaurantId, false),
    enabled: Boolean(restaurantId),
  });

  const restaurant = restaurantQuery.data;
  const rawCategories = useMemo(
    () => menuQuery.data?.categories || [],
    [menuQuery.data?.categories]
  );

  // Filter categories and items client-side by Category Pill, Veg-Only Toggle, and Search
  const filteredCategories = useMemo(() => {
    const query = dishSearch.trim().toLowerCase();

    return rawCategories
      .filter(
        (cat) => selectedCategoryId === 'ALL' || cat.id === selectedCategoryId
      )
      .map((cat) => {
        const items = (cat.items || []).filter((item) => {
          if (vegOnly && !item.is_vegetarian) return false;
          if (
            query &&
            !item.name.toLowerCase().includes(query) &&
            !(item.description || '').toLowerCase().includes(query)
          ) {
            return false;
          }
          return true;
        });
        return { ...cat, items };
      })
      .filter((cat) => cat.items.length > 0);
  }, [rawCategories, selectedCategoryId, vegOnly, dishSearch]);

  if (restaurantQuery.isLoading || menuQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-alabaster items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.brand} />
        <Text className="mt-2 text-xs font-medium text-slate-500">
          Loading kitchen menu...
        </Text>
      </SafeAreaView>
    );
  }

  const isRestaurantOpen = restaurant?.is_open !== false;

  return (
    <SafeAreaView className="flex-1 bg-alabaster" edges={['top']}>
      {/* Top Navigation & Restaurant Info Header */}
      <View className="px-5 pt-3 pb-3 bg-white border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 rounded-full bg-slate-100 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={18} color="#0F172A" />
          </Pressable>

          <View
            className={`rounded-full px-3 py-1 flex-row items-center ${
              isRestaurantOpen ? 'bg-chutney-light' : 'bg-spiced-light'
            }`}
          >
            <View
              className={`h-2 w-2 rounded-full mr-1.5 ${
                isRestaurantOpen ? 'bg-chutney' : 'bg-spiced'
              }`}
            />
            <Text
              className={`text-xs font-extrabold ${
                isRestaurantOpen ? 'text-chutney' : 'text-spiced'
              }`}
            >
              {isRestaurantOpen ? 'Open for Orders' : 'Currently Closed'}
            </Text>
          </View>
        </View>

        <Text className="text-xl font-extrabold text-slate-900">
          {restaurant?.name || 'LittiHub Kitchen'}
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5">
          {restaurant?.address}, {restaurant?.city}
        </Text>

        {!isRestaurantOpen && (
          <View className="mt-3 rounded-xl bg-spiced-light border border-red-200 px-3 py-2 flex-row items-center">
            <Ionicons name="lock-closed" size={15} color="#DC2626" />
            <Text className="ml-2 text-xs font-bold text-spiced flex-1">
              This restaurant is currently closed. You can browse the menu, but
              ordering is paused.
            </Text>
          </View>
        )}

        {/* Dietary Veg-Only Switch & Instant Dish Search */}
        <View className="mt-3 flex-row items-center gap-2.5">
          <Pressable
            onPress={() => setVegOnly(!vegOnly)}
            className={`rounded-xl px-3 py-2.5 border flex-row items-center ${
              vegOnly
                ? 'bg-chutney-light border-chutney'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <View className="h-3.5 w-3.5 items-center justify-center rounded-sm border border-chutney mr-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-chutney" />
            </View>
            <Text
              className={`text-xs font-extrabold ${
                vegOnly ? 'text-chutney' : 'text-slate-700'
              }`}
            >
              Veg Only
            </Text>
          </Pressable>

          <View className="flex-1 flex-row items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
            <Ionicons name="search-outline" size={16} color="#64748B" />
            <TextInput
              value={dishSearch}
              onChangeText={setDishSearch}
              placeholder="Search dishes in menu..."
              placeholderTextColor="#94A3B8"
              className="ml-2 flex-1 text-xs text-slate-900"
            />
            {Boolean(dishSearch) && (
              <Pressable onPress={() => setDishSearch('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Sticky Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          <Pressable
            onPress={() => setSelectedCategoryId('ALL')}
            className={`rounded-full px-3.5 py-1.5 border ${
              selectedCategoryId === 'ALL'
                ? 'bg-brand border-brand'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedCategoryId === 'ALL' ? 'text-white' : 'text-slate-700'
              }`}
            >
              All ({rawCategories.reduce((s, c) => s + c.items.length, 0)})
            </Text>
          </Pressable>

          {rawCategories.map((cat) => {
            const active = selectedCategoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategoryId(cat.id)}
                className={`rounded-full px-3.5 py-1.5 border ${
                  active
                    ? 'bg-brand border-brand'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    active ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {cat.name} ({cat.items.length})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Categorized Dish Sections */}
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {filteredCategories.length === 0 ? (
          <View className="mt-10 rounded-3xl bg-white p-8 items-center border border-slate-200">
            <Ionicons name="fast-food-outline" size={36} color="#94A3B8" />
            <Text className="mt-2 text-base font-bold text-slate-800">
              No matching dishes found
            </Text>
            <Text className="mt-1 text-xs text-slate-500 text-center">
              Try turning off the &quot;Veg Only&quot; filter or clearing your
              search.
            </Text>
          </View>
        ) : (
          filteredCategories.map((category) => (
            <View key={category.id} className="mb-6">
              <View className="mb-3">
                <Text className="text-lg font-extrabold text-slate-900">
                  {category.name}
                </Text>
                {Boolean(category.description) && (
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {category.description}
                  </Text>
                )}
              </View>

              {category.items.map((dish) => {
                const cartItem = itemMap[dish.id];
                const qty = cartItem?.quantity || 0;

                return (
                  <MenuItemCard
                    key={dish.id}
                    item={dish}
                    quantity={qty}
                    isRestaurantOpen={isRestaurantOpen}
                    onAdd={() => handleAddItem(dish, restaurant?.name)}
                    onIncrement={() =>
                      updateQuantity({
                        menu_item_id: dish.id,
                        quantity: qty + 1,
                      })
                    }
                    onDecrement={() =>
                      updateQuantity({
                        menu_item_id: dish.id,
                        quantity: qty - 1,
                      })
                    }
                  />
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Persistent Floating Bottom Cart Bar */}
      <FloatingCartBar />
    </SafeAreaView>
  );
}

