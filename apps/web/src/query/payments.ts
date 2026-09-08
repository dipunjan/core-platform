import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { docId, http, urls, type Order } from '@/api';
import { cartKeys, orderKeys } from './keys';

export type PaymentCheckout =
  | {
      provider: 'simulate';
      orderId: string;
      amount: number;
      currency: string;
    }
  | {
      provider: 'stripe';
      orderId: string;
      clientSecret: string;
      publishableKey: string;
      amount: number;
      currency: string;
    }
  | {
      provider: 'razorpay';
      orderId: string;
      razorpayOrderId: string;
      keyId: string;
      amount: number;
      currency: string;
    };

async function fetchOrder(id: string): Promise<Order> {
  const { data } = await http.get<Order>(urls.order(id));
  return data;
}

export function useOrderQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(orderId ?? ''),
    queryFn: () => fetchOrder(orderId!),
    enabled: Boolean(orderId),
  });
}

export function usePaymentCheckoutMutation() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await http.post<PaymentCheckout>(
        urls.paymentCheckout(orderId),
      );
      return data;
    },
  });
}

export function useSimulatePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await http.post<Order>(urls.paymentSimulate(orderId));
      return data;
    },
    onSuccess: async (order) => {
      const id = docId(order);
      queryClient.setQueryData(orderKeys.detail(id), order);
      await http.delete(urls.cart);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useClearCartAfterPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await http.delete(urls.cart);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
