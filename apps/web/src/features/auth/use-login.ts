import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUser } from "./auth-api.ts";
import { currentUserQueryKey } from "./use-current-user.ts";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
    },
  });
};
