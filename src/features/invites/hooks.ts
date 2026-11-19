'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inviteKeys, invitesApi } from './api';

export function useInvites(enabled = true) {
  return useQuery({
    queryKey: inviteKeys.all,
    queryFn: invitesApi.list,
    staleTime: 30_000,
    enabled,
  });
}

export function useSendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invitesApi.create,
    onSuccess: (result) => {
      if (result.status === 'sent') void queryClient.invalidateQueries({ queryKey: inviteKeys.all });
    },
  });
}
