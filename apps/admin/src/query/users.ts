import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryError, http, urls, type Address, type User } from '@/api';
import { userKeys } from './keys';

export function useUsersQuery() {
  return useQuery({
    queryKey: userKeys.list,
    queryFn: async () => {
      const { data } = await http.get<User[]>(urls.users);
      return data;
    },
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: userKeys.list });

  const create = useMutation({
    mutationFn: async (body: {
      name: string;
      email: string;
      password: string;
      role: 'customer' | 'admin';
      phone: string;
      address: Address;
    }) => {
      await http.post(urls.managedUsers, body);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (input: {
      id: string;
      body: { name: string; phone: string; address: Address };
    }) => {
      await http.patch(urls.user(input.id), input.body);
    },
    onSuccess: invalidate,
  });

  const setRole = useMutation({
    mutationFn: async (input: { id: string; role: 'customer' | 'admin' }) => {
      await http.patch(urls.userRole(input.id), { role: input.role });
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await http.delete(urls.user(id));
    },
    onSuccess: invalidate,
  });

  return { create, update, setRole, remove };
}
