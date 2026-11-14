import { useCurrentUser } from "./use-current-user.ts";

export const useAuthenticatedUser = () => {
  const { data: user } = useCurrentUser();
  if (!user) throw new Error("useAuthenticatedUser must be used inside ProtectedLayout");
  return user;
};
