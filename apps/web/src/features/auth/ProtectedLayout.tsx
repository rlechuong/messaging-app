import { Navigate, Outlet } from "react-router";
import { useCurrentUser } from "./use-current-user.ts";
import { useLogout } from "./use-logout.ts";

export const ProtectedLayout = () => {
  const { data: user, isPending, isError, error } = useCurrentUser();
  const logout = useLogout();

  if (isPending) return <p>Loading...</p>;
  if (isError) throw error;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <header>
        <p>Signed in as {user.username}</p>
        <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
          Log out
        </button>
      </header>
      <Outlet />
    </>
  );
};
