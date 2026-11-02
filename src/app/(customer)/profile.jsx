import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { littiHubApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { useAuthActions } from '../../hooks/useAuth';

export default function CustomerProfileScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { logout } = useAuthActions();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: littiHubApi.getMyProfile,
    enabled: Boolean(token),
  });

  const paymentsQuery = useQuery({
    queryKey: ['my-payments'],
    queryFn: littiHubApi.getMyPayments,
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (profileQuery.data) {
      setFirstName(profileQuery.data.first_name || user?.first_name || '');
      setLastName(profileQuery.data.last_name || user?.last_name || '');
      setPhone(profileQuery.data.phone || '');
    }
  }, [profileQuery.data, user]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      littiHubApi.updateMyProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['my-profile'], updated);
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2500);
    },
  });

  const payments = Array.isArray(paymentsQuery.data)
    ? paymentsQuery.data
    : paymentsQuery.data?.items || [];

  return (
    <SafeAreaView className="flex-1 bg-alabaster" edges={['top']}>
      <ScrollView
        className="flex-1 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-extrabold text-slate-900">
              My Profile
            </Text>
            <Text className="text-xs text-slate-500">{user?.email}</Text>
          </View>
          <Pressable
            onPress={logout}
            className="rounded-xl bg-spiced-light px-3.5 py-2 border border-red-200 flex-row items-center"
          >
            <Ionicons name="log-out-outline" size={16} color="#DC2626" />
            <Text className="ml-1.5 text-xs font-bold text-spiced">
              Sign Out
            </Text>
          </Pressable>
        </View>

        {/* Edit Profile Card (/api/v1/users/me) */}
        <View className="rounded-3xl bg-white p-5 border border-slate-200 mb-5 shadow-sm">
          <Text className="text-base font-extrabold text-slate-900 mb-3">
            Personal Details
          </Text>

          {savedBanner && (
            <View className="mb-3 rounded-xl bg-chutney-light px-3 py-2 flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text className="ml-2 text-xs font-bold text-chutney">
                Profile updated successfully!
              </Text>
            </View>
          )}

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase text-slate-500 mb-1">
                First Name
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase text-slate-500 mb-1">
                Last Name
              </Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-[11px] font-bold uppercase text-slate-500 mb-1">
              Phone Number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900"
            />
          </View>

          <Pressable
            onPress={() => updateProfileMutation.mutate()}
            disabled={updateProfileMutation.isPending}
            className="rounded-xl bg-brand py-3 items-center"
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-xs font-extrabold text-white">
                Save Profile Changes
              </Text>
            )}
          </Pressable>
        </View>

        {/* Payment History Card (/api/v1/payments/my) */}
        <View className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
          <Text className="text-base font-extrabold text-slate-900 mb-3">
            Payment History ({payments.length})
          </Text>

          {payments.length === 0 ? (
            <Text className="text-xs text-slate-500">
              No payment transactions recorded yet.
            </Text>
          ) : (
            payments.map((p) => (
              <View
                key={p.id}
                className="py-3 border-b border-slate-100 flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-xs font-bold text-slate-900">
                    Order #{p.order_id} • {p.payment_method?.toUpperCase()}
                  </Text>
                  <Text className="text-[11px] text-slate-500 mt-0.5">
                    {p.transaction_id || p.id}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-extrabold text-slate-900">
                    ₹{p.amount}
                  </Text>
                  <Text
                    className={`text-[10px] font-bold uppercase ${
                      p.status === 'refunded'
                        ? 'text-spiced'
                        : 'text-chutney'
                    }`}
                  >
                    {p.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
