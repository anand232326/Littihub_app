import { api } from './client';
import {
  DEMO_MENUS,
  DEMO_RESTAURANTS,
  demoState,
  findDemoMenuItem,
  isDemoSession,
  recalculateDemoCart,
} from './demoData';

/**
 * LittiHub API Gateway (:8000/api/v1/*) Service Layer
 * Automatically connects to the live FastAPI Gateway when authenticated with a real JWT,
 * and seamlessly supports Demo Mode for instant testing when the backend is offline.
 */
export const littiHubApi = {
  // ─── 1. Auth & User Profile ─────────────────────────────────────────────────
  register: async (payload) => {
    const { data } = await api.post('/api/v1/auth/register', payload);
    return data;
  },

  login: async ({ email, password }) => {
    const { data } = await api.post('/api/v1/auth/login', { email, password });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/api/v1/auth/me');
    return data;
  },

  createUserProfile: async (payload) => {
    if (isDemoSession()) {
      return {
        id: 'prof_demo_01',
        auth_user_id: 'usr_cust_01',
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    const { data } = await api.post('/api/v1/users/profile', payload);
    return data;
  },

  getMyProfile: async () => {
    if (isDemoSession()) {
      return {
        id: 'prof_demo_01',
        auth_user_id: 'usr_cust_01',
        first_name: 'Anand',
        last_name: 'Kumar',
        phone: '+91 98765 43210',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    const { data } = await api.get('/api/v1/users/me');
    return data;
  },

  updateMyProfile: async (payload) => {
    if (isDemoSession()) {
      return {
        id: 'prof_demo_01',
        auth_user_id: 'usr_cust_01',
        ...payload,
        updated_at: new Date().toISOString(),
      };
    }
    const { data } = await api.patch('/api/v1/users/me', payload);
    return data;
  },

  // ─── 2. Restaurants & Storefront Menu ───────────────────────────────────────
  listRestaurants: async (params = {}) => {
    if (isDemoSession()) {
      let filtered = [...DEMO_RESTAURANTS];
      if (params.city && params.city !== 'All Cities') {
        filtered = filtered.filter(
          (r) => r.city.toLowerCase() === params.city.toLowerCase()
        );
      }
      if (params.is_open !== undefined && params.is_open !== null) {
        filtered = filtered.filter((r) => r.is_open === Boolean(params.is_open));
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.description || '').toLowerCase().includes(q) ||
            r.city.toLowerCase().includes(q)
        );
      }
      return {
        items: filtered,
        page: 1,
        page_size: 10,
        total: filtered.length,
        total_pages: 1,
      };
    }

    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, val]) => val !== undefined && val !== null && val !== ''
      )
    );
    const { data } = await api.get('/api/v1/restaurants', {
      params: cleanParams,
    });
    return data;
  },

  getRestaurant: async (restaurantId) => {
    if (isDemoSession()) {
      return (
        DEMO_RESTAURANTS.find((r) => r.id === restaurantId) ||
        DEMO_RESTAURANTS[0]
      );
    }
    const { data } = await api.get(`/api/v1/restaurants/${restaurantId}`);
    return data;
  },

  getRestaurantMenu: async (restaurantId, onlyAvailable = false) => {
    if (isDemoSession()) {
      const menu = DEMO_MENUS[restaurantId] || {
        restaurant_id: restaurantId,
        categories: [],
      };
      if (!onlyAvailable) return menu;
      return {
        ...menu,
        categories: menu.categories.map((c) => ({
          ...c,
          items: c.items.filter((i) => i.is_available),
        })),
      };
    }
    const { data } = await api.get(`/api/v1/restaurants/${restaurantId}/menu`, {
      params: { only_available: onlyAvailable },
    });
    return data;
  },

  // ─── 3. Cart Management ─────────────────────────────────────────────────────
  getCart: async () => {
    if (isDemoSession()) {
      return recalculateDemoCart();
    }
    const { data } = await api.get('/api/v1/cart');
    return data;
  },

  addItemToCart: async ({ restaurant_id, menu_item_id, quantity = 1 }) => {
    if (isDemoSession()) {
      const dish = findDemoMenuItem(menu_item_id);
      const price = dish?.price || 150;
      const name = dish?.name || 'Special Litti Dish';
      demoState.cart.restaurant_id = restaurant_id;
      const existing = demoState.cart.items.find(
        (i) => i.menu_item_id === menu_item_id
      );
      if (existing) {
        existing.quantity = Math.min(20, existing.quantity + quantity);
        existing.total_price = Number((existing.quantity * price).toFixed(2));
      } else {
        demoState.cart.items.push({
          menu_item_id,
          name,
          price,
          quantity,
          total_price: Number((price * quantity).toFixed(2)),
        });
      }
      return recalculateDemoCart();
    }

    const { data } = await api.post('/api/v1/cart/items', {
      restaurant_id,
      menu_item_id,
      quantity,
    });
    return data;
  },

  updateCartItemQuantity: async ({ menu_item_id, quantity }) => {
    if (isDemoSession()) {
      if (quantity <= 0) {
        demoState.cart.items = demoState.cart.items.filter(
          (i) => i.menu_item_id !== menu_item_id
        );
      } else {
        const clamped = Math.min(20, quantity);
        demoState.cart.items = demoState.cart.items.map((i) =>
          i.menu_item_id === menu_item_id
            ? {
                ...i,
                quantity: clamped,
                total_price: Number((i.price * clamped).toFixed(2)),
              }
            : i
        );
      }
      return recalculateDemoCart();
    }

    if (quantity <= 0) {
      const { data } = await api.delete(`/api/v1/cart/items/${menu_item_id}`);
      return data;
    }
    const { data } = await api.patch(`/api/v1/cart/items/${menu_item_id}`, {
      quantity: Math.min(20, quantity),
    });
    return data;
  },

  removeCartItem: async (menuItemId) => {
    if (isDemoSession()) {
      demoState.cart.items = demoState.cart.items.filter(
        (i) => i.menu_item_id !== menuItemId
      );
      return recalculateDemoCart();
    }
    const { data } = await api.delete(`/api/v1/cart/items/${menuItemId}`);
    return data;
  },

  // ─── 4. Orders & Checkout ───────────────────────────────────────────────────
  createOrder: async ({ payload, idempotencyKey }) => {
    if (isDemoSession()) {
      const cart = recalculateDemoCart();
      const deliveryFee =
        payload.order_type === 'pickup' || cart.subtotal >= 500 ? 0 : 40;
      const newOrder = {
        id: `ord_${Date.now().toString().slice(-6)}`,
        user_id: 'usr_cust_01',
        restaurant_id: payload.restaurant_id,
        order_type: payload.order_type,
        items: cart.items.map((i) => ({
          menu_item_id: i.menu_item_id,
          name: i.name,
          quantity: i.quantity,
          unit_price: i.price,
          total_price: i.total_price,
        })),
        subtotal: cart.subtotal,
        delivery_fee: deliveryFee,
        total_amount: cart.subtotal + deliveryFee,
        status: 'pending',
        payment_status: 'pending',
        transaction_id: null,
        delivery_address:
          payload.order_type === 'delivery' ? payload.delivery_address : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      demoState.orders.unshift(newOrder);
      demoState.cart.items = [];
      recalculateDemoCart();
      return newOrder;
    }

    const { data } = await api.post('/api/v1/orders', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return data;
  },

  listMyOrders: async (params = {}) => {
    if (isDemoSession()) {
      return {
        items: [...demoState.orders],
        total: demoState.orders.length,
      };
    }
    const { data } = await api.get('/api/v1/orders', { params });
    return data;
  },

  getOrder: async (orderId) => {
    if (isDemoSession()) {
      return (
        demoState.orders.find((o) => o.id === orderId) || demoState.orders[0]
      );
    }
    const { data } = await api.get(`/api/v1/orders/${orderId}`);
    return data;
  },

  cancelOrder: async (orderId) => {
    if (isDemoSession()) {
      const target = demoState.orders.find((o) => o.id === orderId);
      if (target) {
        target.status = 'cancelled';
        target.updated_at = new Date().toISOString();
      }
      return { ...target };
    }
    const { data } = await api.patch(`/api/v1/orders/${orderId}/status`, {
      status: 'cancelled',
    });
    return data;
  },

  // ─── 5. Payments ────────────────────────────────────────────────────────────
  payForOrder: async ({ order_id, payment_method }) => {
    if (isDemoSession()) {
      const targetOrder = demoState.orders.find((o) => o.id === order_id);
      const txnId = `TXN-LH-${Math.floor(10000 + Math.random() * 90000)}`;
      if (targetOrder) {
        targetOrder.status = 'confirmed';
        targetOrder.payment_status = 'completed';
        targetOrder.transaction_id = txnId;
        targetOrder.updated_at = new Date().toISOString();
      }
      const paymentRecord = {
        id: `pay_${Date.now().toString().slice(-6)}`,
        order_id,
        user_id: 'usr_cust_01',
        restaurant_id: targetOrder?.restaurant_id || 'rest_patna_01',
        amount: targetOrder?.total_amount || 0,
        payment_method,
        status: 'completed',
        transaction_id: txnId,
        created_at: new Date().toISOString(),
      };
      demoState.payments.unshift(paymentRecord);
      return paymentRecord;
    }

    const { data } = await api.post('/api/v1/payments/pay', {
      order_id,
      payment_method,
    });
    return data;
  },

  getMyPayments: async () => {
    if (isDemoSession()) {
      return [...demoState.payments];
    }
    const { data } = await api.get('/api/v1/payments/my');
    return data;
  },

  refundPayment: async (paymentId) => {
    if (isDemoSession()) {
      const target = demoState.payments.find((p) => p.id === paymentId);
      if (target) {
        target.status = 'refunded';
      }
      return { ...target };
    }
    const { data } = await api.post(`/api/v1/payments/${paymentId}/refund`);
    return data;
  },

  // ─── 6. Restaurant Admin Portal (KOT, Menu, Stock, Finance) ─────────────────
  toggleRestaurantOpenStatus: async (restaurantId, isOpen) => {
    if (isDemoSession()) {
      const target = DEMO_RESTAURANTS.find((r) => r.id === restaurantId);
      if (target) {
        target.is_open = isOpen;
      }
      return { ...target };
    }
    const { data } = await api.patch(
      `/api/v1/admin/restaurants/${restaurantId}/open-status`,
      { is_open: isOpen }
    );
    return data;
  },

  listRestaurantOrdersAdmin: async (restaurantId, params = {}) => {
    if (isDemoSession()) {
      let list = demoState.orders.filter(
        (o) => !restaurantId || o.restaurant_id === restaurantId
      );
      if (params.status) {
        list = list.filter((o) => o.status === params.status);
      }
      if (params.order_type) {
        list = list.filter((o) => o.order_type === params.order_type);
      }
      return { items: list, total: list.length };
    }

    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, val]) => val !== undefined && val !== null && val !== ''
      )
    );
    const { data } = await api.get(
      `/api/v1/admin/restaurants/${restaurantId}/orders`,
      { params: cleanParams }
    );
    return data;
  },

  updateOrderStatusAdmin: async (orderId, status) => {
    if (isDemoSession()) {
      const target = demoState.orders.find((o) => o.id === orderId);
      if (target) {
        target.status = status;
        target.updated_at = new Date().toISOString();
      }
      return { ...target };
    }
    const { data } = await api.patch(`/api/v1/orders/${orderId}/status`, {
      status,
    });
    return data;
  },

  toggleMenuItemAvailability: async (restaurantId, itemId, isAvailable) => {
    if (isDemoSession()) {
      const item = findDemoMenuItem(itemId);
      if (item) {
        item.is_available = isAvailable;
      }
      return { ...item };
    }
    const { data } = await api.patch(
      `/api/v1/admin/restaurants/${restaurantId}/items/${itemId}/availability`,
      { is_available: isAvailable }
    );
    return data;
  },

  createMenuCategory: async (restaurantId, payload) => {
    if (isDemoSession()) {
      const menu = DEMO_MENUS[restaurantId];
      const newCat = {
        id: `cat_${Date.now().toString().slice(-4)}`,
        restaurant_id: restaurantId,
        name: payload.name,
        description: payload.description || '',
        display_order: (menu?.categories?.length || 0) + 1,
        items: [],
      };
      menu?.categories.push(newCat);
      return newCat;
    }
    const { data } = await api.post(
      `/api/v1/admin/restaurants/${restaurantId}/categories`,
      payload
    );
    return data;
  },

  createMenuItem: async (restaurantId, payload) => {
    if (isDemoSession()) {
      const menu = DEMO_MENUS[restaurantId];
      const cat = menu?.categories.find((c) => c.id === payload.category_id);
      const newItem = {
        id: `item_${Date.now().toString().slice(-4)}`,
        restaurant_id: restaurantId,
        ...payload,
        is_available: true,
        is_active: true,
      };
      cat?.items.push(newItem);
      return newItem;
    }
    const { data } = await api.post(
      `/api/v1/admin/restaurants/${restaurantId}/items`,
      payload
    );
    return data;
  },

  listRestaurantPaymentsAdmin: async (restaurantId) => {
    if (isDemoSession()) {
      return demoState.payments.filter(
        (p) => !restaurantId || p.restaurant_id === restaurantId
      );
    }
    const { data } = await api.get(
      `/api/v1/admin/restaurants/${restaurantId}/payments`
    );
    return data;
  },
};
