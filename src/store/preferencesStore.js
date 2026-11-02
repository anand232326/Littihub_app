import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_STORAGE_KEY = 'littihub_user_preferences';

/**
 * Client Preferences & Checkout Draft Store
 * Persists city filter, Veg-Only toggle, delivery/pickup preference,
 * saved delivery addresses, and deterministic Idempotency-Key per checkout draft.
 */
export const usePreferencesStore = create((set, get) => ({
  selectedCity: 'All Cities',
  vegOnly: false,
  openNowOnly: false,
  orderType: 'delivery', // 'delivery' | 'pickup'
  deliveryAddress: '',
  savedAddresses: [
    'Boring Road Crossing, Near Pani Tanki, Patna 800001',
    'Frazer Road, Dakbungalow Chauraha, Patna 800001',
  ],
  checkoutAttemptHash: null,
  checkoutIdempotencyKey: null,

  hydratePreferences: async () => {
    try {
      const raw = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          selectedCity: parsed.selectedCity ?? 'All Cities',
          vegOnly: Boolean(parsed.vegOnly),
          orderType: parsed.orderType ?? 'delivery',
          deliveryAddress: parsed.deliveryAddress ?? '',
          savedAddresses: Array.isArray(parsed.savedAddresses)
            ? parsed.savedAddresses
            : get().savedAddresses,
        });
      }
    } catch {
      // Ignore hydration errors
    }
  },

  persistPreferences: async (partial) => {
    const nextState = { ...get(), ...partial };
    set(partial);
    try {
      await AsyncStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({
          selectedCity: nextState.selectedCity,
          vegOnly: nextState.vegOnly,
          orderType: nextState.orderType,
          deliveryAddress: nextState.deliveryAddress,
          savedAddresses: nextState.savedAddresses,
        })
      );
    } catch {
      // Ignore persistence errors
    }
  },

  setSelectedCity: (selectedCity) => get().persistPreferences({ selectedCity }),
  setVegOnly: (vegOnly) => get().persistPreferences({ vegOnly }),
  setOpenNowOnly: (openNowOnly) => set({ openNowOnly }),
  setOrderType: (orderType) => get().persistPreferences({ orderType }),
  setDeliveryAddress: (deliveryAddress) =>
    get().persistPreferences({ deliveryAddress }),

  addSavedAddress: (address) => {
    const trimmed = address.trim();
    if (!trimmed) return;
    const existing = get().savedAddresses;
    const updated = [trimmed, ...existing.filter((a) => a !== trimmed)].slice(0, 5);
    get().persistPreferences({
      savedAddresses: updated,
      deliveryAddress: trimmed,
    });
  },

  /**
   * Returns a deterministic UUIDv4 Idempotency-Key for the current checkout payload.
   * Reuses the same key on network retries if the payload hasn't changed,
   * and generates a new key whenever cart items, order_type, or address change.
   */
  getOrCreateIdempotencyKey: (payloadSignature) => {
    const { checkoutAttemptHash, checkoutIdempotencyKey } = get();
    if (checkoutAttemptHash === payloadSignature && checkoutIdempotencyKey) {
      return checkoutIdempotencyKey;
    }
    const newKey = generateUUIDv4();
    set({
      checkoutAttemptHash: payloadSignature,
      checkoutIdempotencyKey: newKey,
    });
    return newKey;
  },

  clearCheckoutIdempotencyKey: () =>
    set({ checkoutAttemptHash: null, checkoutIdempotencyKey: null }),
}));

function generateUUIDv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

