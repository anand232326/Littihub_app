import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { littiHubApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { usePreferencesStore } from '../../store/preferencesStore';
import { FloatingCartBar } from '../../components/cart/FloatingCartBar';
import { COLORS } from '../../theme/colors';

const CITIES = ['All Cities', 'Patna', 'Delhi'];

export default function CustomerExploreScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const {
    selectedCity,
    setSelectedCity,
    openNowOnly,
    setOpenNowOnly,
  } = usePreferencesStore();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 300ms Search Debounce (Section 4.2)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const restaurantsQuery = useQuery({
    queryKey: [
      'restaurants',
      {
        city: selectedCity,
        is_open: openNowOnly ? true : undefined,
        search: debouncedSearch,
      },
    ],
    queryFn: () =>
      littiHubApi.listRestaurants({
        page: 1,
        page_size: 20,
        city: selectedCity === 'All Cities' ? undefined : selectedCity,
        is_open: openNowOnly ? true : undefined,
        search: debouncedSearch || undefined,
      }),
    enabled: Boolean(token),
  });

  const restaurants = restaurantsQuery.data?.items || [];

  const renderRestaurantCard = ({ item }) => {
    const isOpen = Boolean(item.is_open);

    return (
      <Pressable
        onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
        className={`mb-4 rounded-3xl bg-white p-5 border border-slate-200 shadow-sm active:opacity-95 ${
          !isOpen ? 'opacity-75' : ''
        }`}
      >
        {/* Top Row: Icon Banner + Live Status Badge */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1 pr-3">
            <View className="h-12 w-12 rounded-2xl bg-brand-light border border-brand/20 items-center justify-center mr-3">
              <Ionicons name="flame" size={24} color={COLORS.brand} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-extrabold text-slate-900">
                {item.name}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Ionicons name="location-outline" size={13} color="#64748B" />
                <Text
                  numberOfLines={1}
                  className="ml-1 text-xs font-medium text-slate-500 flex-1"
                >
                  {item.address}, {item.city}
                </Text>
              </View>
            </View>
          </View>

          {/* Live Open / Closed Badge */}
          <View
            className={`rounded-full px-3 py-1 flex-row items-center ${
              isOpen ? 'bg-chutney-light' : 'bg-spiced-light'
            }`}
          >
            <View
              className={`h-2 w-2 rounded-full mr-1.5 ${
                isOpen ? 'bg-chutney' : 'bg-spiced'
              }`}
            />
            <Text
              className={`text-[11px] font-extrabold ${
                isOpen ? 'text-chutney' : 'text-spiced'
              }`}
            >
              {isOpen ? 'Open Now' : 'Closed'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {Boolean(item.description) && (
          <Text
            numberOfLines={2}
            className="text-xs text-slate-600 leading-4 mb-3"
          >
            {item.description}
          </Text>
        )}

        {/* Footer Info Bar */}
        <View className="pt-3 border-t border-slate-100 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="bicycle-outline" size={15} color="#D94E28" />
            <Text className="ml-1.5 text-xs font-bold text-slate-700">
              Free Delivery above ₹500 • Self-Pickup ₹0
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className="text-xs font-extrabold text-brand mr-1">
              {isOpen ? 'Order Now' : 'Browse Menu'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.brand} />
          </View>
        </View>

        {!isOpen && (
          <View className="mt-2.5 rounded-xl bg-slate-100 px-3 py-1.5 flex-row items-center">
            <Ionicons
              name="information-circle-outline"
              size={14}
              color="#64748B"
            />
            <Text className="ml-1.5 text-[11px] font-semibold text-slate-600">
              Currently Closed (Browse Menu Only)
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-alabaster" edges={['top']}>
      {/* Top Greeting & City Selector */}
      <View className="px-5 pt-3 pb-2 bg-alabaster">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-xs font-bold uppercase tracking-wider text-brand">
              LittiHub Delivery & Pickup
            </Text>
            <Text className="text-2xl font-extrabold text-slate-900">
              Craving Litti, {user?.first_name || 'Foodie'}?
            </Text>
          </View>
        </View>

        {/* City Selector Pills */}
        <View className="flex-row items-center gap-2 mb-3">
          <Ionicons name="location" size={16} color={COLORS.brand} />
          {CITIES.map((city) => {
            const active = selectedCity === city;
            return (
              <Pressable
                key={city}
                onPress={() => setSelectedCity(city)}
                className={`rounded-full px-3.5 py-1.5 border ${
                  active
                    ? 'bg-brand border-brand'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    active ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {city}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Search Input with 300ms Debounce */}
        <View className="flex-row items-center rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-sm mb-3">
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search restaurants, Litti Chokha, Ahuna Mutton..."
            placeholderTextColor="#94A3B8"
            className="ml-2.5 flex-1 text-sm text-slate-900"
          />
          {Boolean(searchInput) && (
            <Pressable onPress={() => setSearchInput('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {/* Quick Filter Chips: All Restaurants vs Open Now */}
        <View className="flex-row items-center gap-2 mb-1">
          <Pressable
            onPress={() => setOpenNowOnly(false)}
            className={`rounded-xl px-3.5 py-2 border flex-row items-center ${
              !openNowOnly
                ? 'bg-slate-900 border-slate-900'
                : 'bg-white border-slate-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                !openNowOnly ? 'text-white' : 'text-slate-700'
              }`}
            >
              All Restaurants
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setOpenNowOnly(!openNowOnly)}
            className={`rounded-xl px-3.5 py-2 border flex-row items-center ${
              openNowOnly
                ? 'bg-chutney border-chutney'
                : 'bg-white border-slate-200'
            }`}
          >
            <View
              className={`h-2 w-2 rounded-full mr-1.5 ${
                openNowOnly ? 'bg-white' : 'bg-chutney'
              }`}
            />
            <Text
              className={`text-xs font-bold ${
                openNowOnly ? 'text-white' : 'text-slate-700'
              }`}
            >
              Open Now
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Restaurant List */}
      {restaurantsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Text className="mt-2 text-xs font-medium text-slate-500">
            Finding kitchens near you...
          </Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderRestaurantCard}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={restaurantsQuery.isRefetching}
              onRefresh={() => restaurantsQuery.refetch()}
              tintColor={COLORS.brand}
            />
          }
          ListEmptyComponent={
            <View className="mt-12 items-center justify-center rounded-3xl bg-white p-8 border border-slate-200">
              <Ionicons name="restaurant-outline" size={40} color="#94A3B8" />
              <Text className="mt-3 text-base font-bold text-slate-800">
                No restaurants match your filters
              </Text>
              <Text className="mt-1 text-xs text-slate-500 text-center">
                Try switching to &quot;All Cities&quot; or clearing your search
                query.
              </Text>
            </View>
          }
        />
      )}

      {/* Persistent Floating Bottom Cart Bar */}
      <FloatingCartBar />
    </SafeAreaView>
  );
}
