import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { littiHubApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

export default function AdminMenuStockScreen() {
  const queryClient = useQueryClient();
  const activeRestaurantId =
    useAuthStore((s) => s.activeRestaurantId) || 'rest_patna_01';

  const [showAddDishForm, setShowAddDishForm] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishVeg, setNewDishVeg] = useState(true);

  const menuQuery = useQuery({
    queryKey: ['restaurant-menu', activeRestaurantId],
    queryFn: () => littiHubApi.getRestaurantMenu(activeRestaurantId, false),
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ itemId, isAvailable }) =>
      littiHubApi.toggleMenuItemAvailability(
        activeRestaurantId,
        itemId,
        isAvailable
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['restaurant-menu', activeRestaurantId],
      });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async () => {
      const firstCatId =
        menuQuery.data?.categories?.[0]?.id || 'cat_signature_litti';
      return await littiHubApi.createMenuItem(activeRestaurantId, {
        category_id: firstCatId,
        name: newDishName.trim(),
        description: newDishDesc.trim() || 'Freshly prepared LittiHub specialty',
        price: Number(newDishPrice) || 150,
        is_vegetarian: newDishVeg,
        preparation_time_minutes: 15,
      });
    },
    onSuccess: () => {
      setNewDishName('');
      setNewDishPrice('');
      setNewDishDesc('');
      setShowAddDishForm(false);
      queryClient.invalidateQueries({
        queryKey: ['restaurant-menu', activeRestaurantId],
      });
    },
  });

  const categories = menuQuery.data?.categories || [];

  return (
    <SafeAreaView className="flex-1 bg-alabaster" edges={['top']}>
      <View className="px-5 pt-3 pb-3 bg-white border-b border-slate-200 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-extrabold text-slate-900">
            Menu & Stock Manager
          </Text>
          <Text className="text-xs text-slate-500">
            1-Tap In-Stock switches & Dish Catalog
          </Text>
        </View>

        <Pressable
          onPress={() => setShowAddDishForm((v) => !v)}
          className="rounded-xl bg-brand px-3.5 py-2 flex-row items-center"
        >
          <Ionicons
            name={showAddDishForm ? 'close' : 'add-circle-outline'}
            size={16}
            color="#FFFFFF"
          />
          <Text className="ml-1.5 text-xs font-extrabold text-white">
            {showAddDishForm ? 'Close' : 'Add Dish'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Quick Add Dish Drawer */}
        {showAddDishForm && (
          <View className="mb-5 rounded-3xl bg-white p-5 border border-brand/30 shadow-sm">
            <Text className="text-sm font-extrabold text-slate-900 mb-3">
              Add New Dish to Menu
            </Text>

            <TextInput
              value={newDishName}
              onChangeText={setNewDishName}
              placeholder="Dish Name (e.g., Sattu Kachori Platter)"
              placeholderTextColor="#94A3B8"
              className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900"
            />

            <View className="flex-row gap-3 mb-3">
              <TextInput
                value={newDishPrice}
                onChangeText={setNewDishPrice}
                placeholder="Price (₹)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900"
              />

              <Pressable
                onPress={() => setNewDishVeg((v) => !v)}
                className={`rounded-xl px-4 py-2.5 border flex-row items-center ${
                  newDishVeg
                    ? 'bg-chutney-light border-chutney'
                    : 'bg-spiced-light border-spiced'
                }`}
              >
                <Text
                  className={`text-xs font-extrabold ${
                    newDishVeg ? 'text-chutney' : 'text-spiced'
                  }`}
                >
                  {newDishVeg ? '🟢 Vegetarian' : '🔴 Non-Veg'}
                </Text>
              </Pressable>
            </View>

            <TextInput
              value={newDishDesc}
              onChangeText={setNewDishDesc}
              placeholder="Short description..."
              placeholderTextColor="#94A3B8"
              className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900"
            />

            <Pressable
              onPress={() => {
                if (newDishName.trim()) createItemMutation.mutate();
              }}
              className="rounded-xl bg-brand py-3 items-center"
            >
              <Text className="text-xs font-extrabold text-white">
                Save & Publish Dish
              </Text>
            </Pressable>
          </View>
        )}

        {menuQuery.isLoading ? (
          <ActivityIndicator size="large" color={COLORS.brand} />
        ) : (
          categories.map((category) => (
            <View key={category.id} className="mb-6">
              <View className="flex-row items-center justify-between mb-2.5">
                <Text className="text-base font-extrabold text-slate-900">
                  {category.name}
                </Text>
                <Text className="text-xs font-bold text-slate-400">
                  {category.items.length} items
                </Text>
              </View>

              {category.items.map((item) => {
                const isAvailable = item.is_available !== false;
                return (
                  <View
                    key={item.id}
                    className="mb-2.5 rounded-2xl bg-white p-4 border border-slate-200 flex-row items-center justify-between shadow-sm"
                  >
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center gap-2 mb-1">
                        <View
                          className={`h-3.5 w-3.5 items-center justify-center rounded-sm border ${
                            item.is_vegetarian
                              ? 'border-chutney'
                              : 'border-spiced'
                          }`}
                        >
                          <View
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.is_vegetarian ? 'bg-chutney' : 'bg-spiced'
                            }`}
                          />
                        </View>
                        <Text className="text-sm font-bold text-slate-900">
                          {item.name}
                        </Text>
                      </View>
                      <Text className="text-xs font-extrabold text-slate-700">
                        ₹{item.price} • ⏱ {item.preparation_time_minutes} mins
                      </Text>
                    </View>

                    <View className="items-end">
                      <Switch
                        value={isAvailable}
                        onValueChange={(val) =>
                          toggleAvailabilityMutation.mutate({
                            itemId: item.id,
                            isAvailable: val,
                          })
                        }
                        trackColor={{ false: '#CBD5E1', true: '#BBF7D0' }}
                        thumbColor={isAvailable ? '#16A34A' : '#64748B'}
                      />
                      <Text
                        className={`text-[10px] font-extrabold uppercase mt-0.5 ${
                          isAvailable ? 'text-chutney' : 'text-spiced'
                        }`}
                      >
                        {isAvailable ? 'In Stock' : 'Sold Out'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
