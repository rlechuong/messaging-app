import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerUser } from "./auth-api.ts";
import { currentUserQueryKey } from "./use-current-user.ts";

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
    },
  });
};
