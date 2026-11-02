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

export default function RegisterScreen() {
  const { registerMutation } = useAuthActions();

  const [role, setRole] = useState('customer'); // 'customer' | 'restaurant_admin'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleRegister = async () => {
    setFormError('');

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First name and last name are required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
        role,
      });
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    }
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
          className="px-6 py-6"
        >
          <View className="w-full max-w-md self-center rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <Text className="text-2xl font-extrabold text-slate-900">
              Create Your Account
            </Text>
            <Text className="mt-1 text-xs text-slate-500 mb-5">
              Zero-friction onboarding: registers, logs in & creates your
              profile in 1 tap.
            </Text>

            {/* Role Selector (Customer vs Partner Admin) */}
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              I am joining as a
            </Text>
            <View className="flex-row gap-3 mb-5">
              <Pressable
                onPress={() => setRole('customer')}
                className={`flex-1 rounded-xl border py-3 px-3 items-center ${
                  role === 'customer'
                    ? 'bg-brand-light border-brand'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    role === 'customer' ? 'text-brand' : 'text-slate-600'
                  }`}
                >
                  🍛 Customer
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setRole('restaurant_admin')}
                className={`flex-1 rounded-xl border py-3 px-3 items-center ${
                  role === 'restaurant_admin'
                    ? 'bg-brand-light border-brand'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    role === 'restaurant_admin'
                      ? 'text-brand'
                      : 'text-slate-600'
                  }`}
                >
                  👨‍🍳 Restaurant Partner
                </Text>
              </Pressable>
            </View>

            {Boolean(formError) && (
              <View className="mb-4 rounded-xl bg-spiced-light px-4 py-3 border border-red-200 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text className="ml-2 flex-1 text-xs font-medium text-spiced">
                  {formError}
                </Text>
              </View>
            )}

            {/* First & Last Name Row */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  First Name
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Anand"
                  placeholderTextColor="#94A3B8"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Last Name
                </Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Kumar"
                  placeholderTextColor="#94A3B8"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900"
                />
              </View>
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900"
              />
            </View>

            {/* Phone (for user-service profile) */}
            <View className="mb-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number (Optional)
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900"
              />
            </View>

            {/* Password */}
            <View className="mb-6">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password (Min 8 characters)
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                autoCapitalize="none"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900"
              />
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleRegister}
              disabled={registerMutation.isPending}
              className="rounded-xl bg-brand py-3.5 items-center justify-center active:opacity-90"
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-base font-bold text-white">
                  Create Account & Continue
                </Text>
              )}
            </Pressable>

            <View className="mt-5 flex-row justify-center items-center">
              <Text className="text-sm text-slate-600">
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="text-sm font-bold text-brand">Sign In</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

