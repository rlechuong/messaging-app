import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "./auth-api.ts";

export const currentUserQueryKey = ["auth", "currentUser"] as const;

export const useCurrentUser = () =>
  useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
