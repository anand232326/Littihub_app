import { useAuthStore } from '../store/authStore';

/**
 * Realistic LittiHub Fallback & Demo Dataset
 * Matches exact FastAPI Pydantic schemas from Section 6.1 of frontend_system_design.md.
 * Used automatically when logged in via "Demo Customer" / "Demo Kitchen Admin".
 */
export function isDemoSession() {
  const token = useAuthStore.getState().token;
  return token === 'demo-customer-token' || token === 'demo-admin-token';
}

export const DEMO_RESTAURANTS = [
  {
    id: 'rest_patna_01',
    name: 'Maurya Litti & Chokha House',
    slug: 'maurya-litti-chokha-house',
    description:
      'Authentic coal-roasted Desi Ghee Litti, smoky Baigan Bharta, and Champaran Ahuna Mutton.',
    phone: '+91 98350 11223',
    email: 'kitchen@mauryalitti.in',
    address: 'Dakbungalow Chauraha, Frazer Road',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800001',
    latitude: 25.6093,
    longitude: 85.1376,
    is_active: true,
    is_open: true,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-11-02T08:00:00Z',
  },
  {
    id: 'rest_patna_02',
    name: 'Boring Road Sattu & Tandoor Express',
    slug: 'boring-road-sattu-express',
    description:
      'Crispy stuffed Sattu Parathas, Kulhad Lassi, and spicy Dhaniya Chutney platters.',
    phone: '+91 98350 44556',
    email: 'orders@sattuexpress.in',
    address: 'Boring Road Crossing, Near Pani Tanki',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800001',
    latitude: 25.6155,
    longitude: 85.1198,
    is_active: true,
    is_open: true,
    created_at: '2026-02-15T08:00:00Z',
    updated_at: '2026-11-02T08:00:00Z',
  },
  {
    id: 'rest_delhi_01',
    name: 'Magadh Kitchen & Angithi',
    slug: 'magadh-kitchen-angithi',
    description:
      'Traditional wood-fired Litti platters, Dal Pitha, and Makhana Kheer in Connaught Place.',
    phone: '+91 98111 22334',
    email: 'hello@magadhkitchen.in',
    address: 'Block M, Connaught Place',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6315,
    longitude: 77.2167,
    is_active: true,
    is_open: false,
    created_at: '2026-03-01T08:00:00Z',
    updated_at: '2026-11-02T08:00:00Z',
  },
];

export const DEMO_MENUS = {
  rest_patna_01: {
    restaurant_id: 'rest_patna_01',
    categories: [
      {
        id: 'cat_signature_litti',
        restaurant_id: 'rest_patna_01',
        name: 'Signature Ghee Littis',
        description: 'Roasted over cow-dung & charcoal embers, dipped in pure desi ghee',
        display_order: 1,
        items: [
          {
            id: 'item_litti_01',
            restaurant_id: 'rest_patna_01',
            category_id: 'cat_signature_litti',
            name: 'Special Desi Ghee Litti Chokha (2 Pcs)',
            description:
              'Stuffed spiced sattu litti dipped in cow ghee, served with roasted brinjal-tomato chokha & green chutney.',
            price: 140,
            image_url: null,
            is_vegetarian: true,
            is_available: true,
            is_active: true,
            preparation_time_minutes: 15,
          },
          {
            id: 'item_litti_02',
            restaurant_id: 'rest_patna_01',
            category_id: 'cat_signature_litti',
            name: 'Paneer Masala Stuffed Litti Platter (4 Pcs)',
            description:
              'Family platter of 4 charcoal-roasted littis with spiced paneer-sattu filling & garlic chutney.',
            price: 260,
            image_url: null,
            is_vegetarian: true,
            is_available: true,
            is_active: true,
            preparation_time_minutes: 20,
          },
        ],
      },
      {
        id: 'cat_champaran_specials',
        restaurant_id: 'rest_patna_01',
        name: 'Champaran Handi Specials',
        description: 'Slow-cooked in sealed earthen clay pots with whole garlic & mustard oil',
        display_order: 2,
        items: [
          {
            id: 'item_handi_01',
            restaurant_id: 'rest_patna_01',
            category_id: 'cat_champaran_specials',
            name: 'Ahuna Mutton Handi with 2 Ghee Littis',
            description:
              'Tender Champaran mutton slow-cooked in clay handi, paired with 2 hot desi ghee littis.',
            price: 380,
            image_url: null,
            is_vegetarian: false,
            is_available: true,
            is_active: true,
            preparation_time_minutes: 25,
          },
          {
            id: 'item_handi_02',
            restaurant_id: 'rest_patna_01',
            category_id: 'cat_champaran_specials',
            name: 'Dehati Chicken Curry & Litti Combo',
            description: 'Homestyle spicy Bihari chicken curry with 2 roasted littis.',
            price: 290,
            image_url: null,
            is_vegetarian: false,
            is_available: false,
            is_active: true,
            preparation_time_minutes: 25,
          },
        ],
      },
      {
        id: 'cat_beverages_desserts',
        restaurant_id: 'rest_patna_01',
        name: 'Beverages & Sweets',
        description: 'Traditional drinks & Bihari desserts',
        display_order: 3,
        items: [
          {
            id: 'item_bev_01',
            restaurant_id: 'rest_patna_01',
            category_id: 'cat_beverages_desserts',
            name: 'Chilled Masala Sattu Sharbat',
            description:
              'Refreshing roasted gram flour drink with black salt, roasted cumin, lemon & mint.',
            price: 70,
            image_url: null,
            is_vegetarian: true,
            is_available: true,
            is_active: true,
            preparation_time_minutes: 5,
          },
          {
            id: 'item_bev_02',
            restaurant_id: 'rest_patna_01',
            category_id: 'cat_beverages_desserts',
            name: 'Darbhanga Makhana Kheer',
            description: 'Slow-simmered foxnut pudding garnished with saffron and pistachios.',
            price: 120,
            image_url: null,
            is_vegetarian: true,
            is_available: true,
            is_active: true,
            preparation_time_minutes: 10,
          },
        ],
      },
    ],
  },
  rest_patna_02: {
    restaurant_id: 'rest_patna_02',
    categories: [
      {
        id: 'cat_paratha_01',
        restaurant_id: 'rest_patna_02',
        name: 'Sattu Parathas & Combos',
        description: 'Griddle-roasted stuffed parathas with white butter & chokha',
        display_order: 1,
        items: [
          {
            id: 'item_par_01',
            restaurant_id: 'rest_patna_02',
            category_id: 'cat_paratha_01',
            name: '2x Makuni Sattu Paratha + Baigan Chokha',
            description: 'Golden tawa-fried sattu parathas served with smoky chokha & mango pickle.',
            price: 150,
            image_url: null,
            is_vegetarian: true,
            is_available: true,
            is_active: true,
            preparation_time_minutes: 15,
          },
          {
            id: 'item_par_02',
            restaurant_id: 'rest_patna_02',
            category_id: 'cat_paratha_01',
            name: 'Kulhad Malai Lassi',
            description: 'Thick earthen-pot sweet yogurt lassi topped with rabri malai.',
            price: 90,
            image_url: null,
            is_vegetarian: true,
            is_available: true,
            is_active: true,
            preparation_time_minutes: 5,
          },
        ],
      },
    ],
  },
};

// Mutable Demo State for Cart, Orders, Payments & Inventory
export const demoState = {
  cart: {
    user_id: 'usr_cust_01',
    restaurant_id: null,
    items: [],
    subtotal: 0,
    total_items: 0,
  },
  orders: [
    {
      id: 'ord_demo_101',
      user_id: 'usr_cust_01',
      restaurant_id: 'rest_patna_01',
      order_type: 'delivery',
      items: [
        {
          menu_item_id: 'item_litti_01',
          name: 'Special Desi Ghee Litti Chokha (2 Pcs)',
          quantity: 2,
          unit_price: 140,
          total_price: 280,
        },
        {
          menu_item_id: 'item_bev_02',
          name: 'Darbhanga Makhana Kheer',
          quantity: 1,
          unit_price: 120,
          total_price: 120,
        },
      ],
      subtotal: 400,
      delivery_fee: 40,
      total_amount: 440,
      status: 'confirmed',
      payment_status: 'completed',
      transaction_id: 'TXN-LH-90812',
      delivery_address: 'Boring Road Crossing, Near Pani Tanki, Patna 800001',
      created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord_demo_102',
      user_id: 'usr_cust_02',
      restaurant_id: 'rest_patna_01',
      order_type: 'pickup',
      items: [
        {
          menu_item_id: 'item_handi_01',
          name: 'Ahuna Mutton Handi with 2 Ghee Littis',
          quantity: 1,
          unit_price: 380,
          total_price: 380,
        },
      ],
      subtotal: 380,
      delivery_fee: 0,
      total_amount: 380,
      status: 'preparing',
      payment_status: 'completed',
      transaction_id: 'TXN-LH-90845',
      delivery_address: null,
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
  ],
  payments: [
    {
      id: 'pay_demo_01',
      order_id: 'ord_demo_101',
      user_id: 'usr_cust_01',
      restaurant_id: 'rest_patna_01',
      amount: 440,
      payment_method: 'upi',
      status: 'completed',
      transaction_id: 'TXN-LH-90812',
      created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'pay_demo_02',
      order_id: 'ord_demo_102',
      user_id: 'usr_cust_02',
      restaurant_id: 'rest_patna_01',
      amount: 380,
      payment_method: 'card',
      status: 'completed',
      transaction_id: 'TXN-LH-90845',
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
  ],
};

export function findDemoMenuItem(menuItemId) {
  for (const menu of Object.values(DEMO_MENUS)) {
    for (const cat of menu.categories) {
      const found = cat.items.find((i) => i.id === menuItemId);
      if (found) return found;
    }
  }
  return null;
}

export function recalculateDemoCart() {
  const items = demoState.cart.items;
  const subtotal = items.reduce((sum, i) => sum + i.total_price, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  demoState.cart = {
    ...demoState.cart,
    restaurant_id: items.length > 0 ? demoState.cart.restaurant_id : null,
    subtotal: Number(subtotal.toFixed(2)),
    total_items: totalItems,
  };
  return { ...demoState.cart, items: [...demoState.cart.items] };
}

