import { Navigate, Outlet } from "react-router";
import { useCurrentUser } from "./use-current-user.ts";

export const GuestLayout = () => {
  const { data: user, isPending, isError, error } = useCurrentUser();

  if (isPending) return <p>Loading...</p>;
  if (isError) throw error;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
};
