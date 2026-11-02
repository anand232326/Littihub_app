import { useMutation, useQueryClient } from '@tanstack/react-query';
import { littiHubApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';

/**
 * Ensures the user has a profile record in user-service.
 * If GET /api/v1/users/me returns 404, lazily creates the profile in the background.
 */
async function ensureUserProfile(user, phone) {
  try {
    const profile = await littiHubApi.getMyProfile();
    useAuthStore.getState().setProfile(profile);
    return profile;
  } catch (err) {
    if (err.status === 404 && user) {
      try {
        const created = await littiHubApi.createUserProfile({
          first_name: user.first_name || 'LittiHub',
          last_name: user.last_name || 'User',
          phone: phone || undefined,
        });
        useAuthStore.getState().setProfile(created);
        return created;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function useAuthActions() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  // 1. Login Mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const loginRes = await littiHubApi.login({
        email: email.trim().toLowerCase(),
        password,
      });
      await setSession({
        token: loginRes.access_token,
        user: loginRes.user,
      });
      await ensureUserProfile(loginRes.user);
      return loginRes;
    },
  });

  // 2. Seamless Chained Register -> Login -> Create Profile Mutation (Section 4.1)
  const registerMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      first_name,
      last_name,
      phone,
      role = 'customer',
    }) => {
      const cleanEmail = email.trim().toLowerCase();

      // Step A: Register in auth-service
      await littiHubApi.register({
        email: cleanEmail,
        password,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        role,
      });

      // Step B: Immediately Login to obtain JWT access_token
      const loginRes = await littiHubApi.login({
        email: cleanEmail,
        password,
      });

      await setSession({
        token: loginRes.access_token,
        user: loginRes.user,
      });

      // Step C: Create User Profile in user-service using the new Bearer token
      try {
        const profile = await littiHubApi.createUserProfile({
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          phone: phone?.trim() || undefined,
        });
        useAuthStore.getState().setProfile(profile);
      } catch {
        // Fallback if profile already exists
        await ensureUserProfile(loginRes.user, phone?.trim());
      }

      return loginRes;
    },
  });

  const logout = async () => {
    queryClient.clear();
    await clearSession();
  };

  return {
    loginMutation,
    registerMutation,
    logout,
  };
}

