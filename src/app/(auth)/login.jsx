import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthActions } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { API_DISPLAY_URL } from '../../api/client';

export default function LoginScreen() {
  const { loginMutation } = useAuthActions();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const handleLogin = async () => {
    setFormError('');
    if (!email.trim() || !password) {
      setFormError('Please enter both your email address and password.');
      return;
    }

    try {
      await loginMutation.mutateAsync({ email, password });
    } catch (err) {
      setFormError(err.message || 'Invalid credentials or server unreachable.');
    }
  };

  // Allows instant testing even before the backend (:8000) is started
  const handleQuickDemo = async (role) => {
    const isPartner = role === 'restaurant_admin';
    await setSession({
      token: isPartner ? 'demo-admin-token' : 'demo-customer-token',
      user: {
        id: isPartner ? 'usr_admin_01' : 'usr_cust_01',
        email: isPartner ? 'partner@littihub.in' : 'anand@littihub.in',
        first_name: isPartner ? 'Maurya' : 'Anand',
        last_name: isPartner ? 'Kitchen' : 'Kumar',
        role,
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-alabaster">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          className="px-6 py-8"
        >
          <View className="w-full max-w-md self-center">
            {/* Brand Header */}
            <View className="items-center mb-8">
              <View className="h-16 w-16 rounded-2xl bg-brand items-center justify-center shadow-sm mb-3">
                <Ionicons name="flame" size={34} color="#FFFFFF" />
              </View>
              <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">
                LittiHub
              </Text>
              <Text className="mt-1 text-sm text-slate-600 text-center">
                Authentic Roasted Litti Chokha & Regional Favorites
              </Text>
            </View>

            {/* Login Form Card */}
            <View className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <Text className="text-xl font-bold text-slate-900 mb-1">
                Welcome Back
              </Text>
              <Text className="text-xs text-slate-500 mb-5">
                Sign in with your LittiHub account ({API_DISPLAY_URL})
              </Text>

              {Boolean(formError) && (
                <View className="mb-4 rounded-xl bg-spiced-light px-4 py-3 border border-red-200 flex-row items-center">
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text className="ml-2 flex-1 text-xs font-medium text-spiced">
                    {formError}
                  </Text>
                </View>
              )}

              {/* Email Field */}
              <View className="mb-4">
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </Text>
                <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <Ionicons name="mail-outline" size={18} color="#64748B" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="ml-2.5 flex-1 text-sm text-slate-900"
                  />
                </View>
              </View>

              {/* Password Field */}
              <View className="mb-6">
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </Text>
                <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#64748B"
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    className="ml-2.5 flex-1 text-sm text-slate-900"
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#64748B"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Primary Sign In CTA */}
              <Pressable
                onPress={handleLogin}
                disabled={loginMutation.isPending}
                className="rounded-xl bg-brand py-3.5 items-center justify-center active:opacity-90"
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-base font-bold text-white">
                    Sign In
                  </Text>
                )}
              </Pressable>

              {/* Register Link */}
              <View className="mt-5 flex-row justify-center items-center">
                <Text className="text-sm text-slate-600">
                  New to LittiHub?{' '}
                </Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable>
                    <Text className="text-sm font-bold text-brand">
                      Create Account
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* Quick Interactive Demo Section (Customer vs Restaurant Admin) */}
            <View className="mt-6 rounded-2xl bg-white/80 p-4 border border-slate-200">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center mb-3">
                Instant Preview Mode (Works Offline or Without Backend)
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => handleQuickDemo('customer')}
                  className="flex-1 rounded-xl bg-brand-light border border-brand/30 py-2.5 px-3 items-center"
                >
                  <Text className="text-xs font-bold text-brand">
                    🍛 Demo Customer
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleQuickDemo('restaurant_admin')}
                  className="flex-1 rounded-xl bg-sattu-light border border-sattu/40 py-2.5 px-3 items-center"
                >
                  <Text className="text-xs font-bold text-amber-800">
                    👨‍🍳 Demo Kitchen Admin
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

