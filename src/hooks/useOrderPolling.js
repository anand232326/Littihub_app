import { useQuery } from '@tanstack/react-query';
import { littiHubApi } from '../api/endpoints';

const TERMINAL_STATUSES = new Set(['delivered', 'picked_up', 'cancelled']);

/**
 * Adaptive 5-Second Live Order Polling Hook (Section 6.3)
 * Polls GET /api/v1/orders/{orderId} every 5s while order is active,
 * and automatically stops polling once delivered, picked_up, or cancelled.
 */
export function useOrderTracking(orderId) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => littiHubApi.getOrder(orderId),
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && TERMINAL_STATUSES.has(status)) {
        return false;
      }
      return 5000;
    },
  });
}

