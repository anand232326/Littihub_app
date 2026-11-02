import { create } from 'zustand';
import { secureStorage } from '../utils/storage';

const TOKEN_KEY = 'littihub_access_token';
const USER_KEY = 'littihub_auth_user';
const ACTIVE_RESTAURANT_KEY = 'littihub_admin_restaurant_id';

/**
 * Global Authentication & Role State Store (Zustand + SecureStore)
 * Stores JWT access_token, authenticated user object (with role),
 * and active restaurant ID for restaurant admins.
 */
export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  profile: null,
  activeRestaurantId: null,
  isHydrated: false,

  hydrateSession: async () => {
    try {
      const [token, userJson, savedRestaurantId] = await Promise.all([
        secureStorage.getItem(TOKEN_KEY),
        secureStorage.getItem(USER_KEY),
        secureStorage.getItem(ACTIVE_RESTAURANT_KEY),
      ]);
      const user = userJson ? JSON.parse(userJson) : null;
      set({
        token: token || null,
        user: token && user ? user : null,
        activeRestaurantId: savedRestaurantId || null,
        isHydrated: true,
      });
    } catch {
      set({ token: null, user: null, isHydrated: true });
    }
  },

  setSession: async ({ token, user }) => {
    await Promise.all([
      secureStorage.setItem(TOKEN_KEY, token),
      secureStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
    set({ token, user });
  },

  setProfile: (profile) => set({ profile }),

  setActiveRestaurantId: async (restaurantId) => {
    if (restaurantId) {
      await secureStorage.setItem(ACTIVE_RESTAURANT_KEY, restaurantId);
    } else {
      await secureStorage.removeItem(ACTIVE_RESTAURANT_KEY);
    }
    set({ activeRestaurantId: restaurantId });
  },

  clearSession: async () => {
    await Promise.all([
      secureStorage.removeItem(TOKEN_KEY),
      secureStorage.removeItem(USER_KEY),
    ]);
    set({ token: null, user: null, profile: null });
  },
}));

