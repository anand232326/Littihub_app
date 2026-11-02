import { useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { littiHubApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';

export const CART_QUERY_KEY = ['cart'];

/**
 * Smart Cart Hook (Section 6.2 of frontend_system_design.md)
 * - Memoizes an O(1) item lookup map by menu_item_id
 * - Optimistically updates [- qty +] steppers
 * - Enforces 1..20 item cap and 0 -> DELETE transition
 * - Handles Single-Restaurant Cart Conflicts gracefully
 */
export function useCart() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const cartQuery = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: littiHubApi.getCart,
    enabled: Boolean(token),
  });

  // O(1) lookup map: Record<menu_item_id, CartItem>
  const itemMap = useMemo(() => {
    const map = {};
    for (const item of cartQuery.data?.items || []) {
      map[item.menu_item_id] = item;
    }
    return map;
  }, [cartQuery.data?.items]);

  const addItemMutation = useMutation({
    mutationFn: littiHubApi.addItemToCart,
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: littiHubApi.updateCartItemQuantity,
    onMutate: async ({ menu_item_id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData(CART_QUERY_KEY);

      if (previousCart) {
        const clampedQty = Math.min(20, quantity);
        let nextItems;
        if (clampedQty <= 0) {
          nextItems = previousCart.items.filter(
            (i) => i.menu_item_id !== menu_item_id
          );
        } else {
          nextItems = previousCart.items.map((i) =>
            i.menu_item_id === menu_item_id
              ? {
                  ...i,
                  quantity: clampedQty,
                  total_price: Number((i.price * clampedQty).toFixed(2)),
                }
              : i
          );
        }

        const nextSubtotal = nextItems.reduce(
          (sum, i) => sum + i.total_price,
          0
        );
        const nextTotalItems = nextItems.reduce(
          (sum, i) => sum + i.quantity,
          0
        );

        queryClient.setQueryData(CART_QUERY_KEY, {
          ...previousCart,
          restaurant_id:
            nextItems.length > 0 ? previousCart.restaurant_id : null,
          items: nextItems,
          subtotal: Number(nextSubtotal.toFixed(2)),
          total_items: nextTotalItems,
        });
      }

      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
    },
  });

  const clearCartSafely = async () => {
    const currentCart = cartQuery.data;
    if (currentCart?.items?.length) {
      for (const cartItem of currentCart.items) {
        await littiHubApi.removeCartItem(cartItem.menu_item_id);
      }
    }
    queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
  };

  const clearAndAddFromNewRestaurant = async (item) => {
    await clearCartSafely();
    return addItemMutation.mutateAsync({
      restaurant_id: item.restaurant_id,
      menu_item_id: item.id,
      quantity: 1,
    });
  };

  const handleAddItem = (item, restaurantName = 'this restaurant') => {
    const currentCart = cartQuery.data;
    const hasDifferentRestaurant =
      currentCart &&
      currentCart.total_items > 0 &&
      currentCart.restaurant_id &&
      currentCart.restaurant_id !== item.restaurant_id;

    if (hasDifferentRestaurant) {
      const message = `Your cart contains dishes from another restaurant. Do you want to discard them and add "${item.name}" from ${restaurantName}?`;

      if (Platform.OS === 'web') {
        if (window.confirm(`Replace cart items?\n\n${message}`)) {
          clearAndAddFromNewRestaurant(item);
        }
        return;
      }

      Alert.alert('Replace cart items?', message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace Cart',
          style: 'destructive',
          onPress: () => clearAndAddFromNewRestaurant(item),
        },
      ]);
      return;
    }

    addItemMutation.mutate({
      restaurant_id: item.restaurant_id,
      menu_item_id: item.id,
      quantity: 1,
    });
  };

  return {
    cart: cartQuery.data,
    itemMap,
    isLoading: cartQuery.isLoading,
    isMutating: addItemMutation.isPending || updateQuantityMutation.isPending,
    handleAddItem,
    updateQuantity: updateQuantityMutation.mutate,
    clearCartSafely,
  };
}

