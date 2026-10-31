import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutUser } from "./auth-api.ts";
import { currentUserQueryKey } from "./use-current-user.ts";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(currentUserQueryKey, null);
    },
    onError: () => queryClient.invalidateQueries({ queryKey: currentUserQueryKey }),
  });
};
