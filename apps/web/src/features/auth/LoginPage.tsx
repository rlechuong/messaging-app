import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@messaging-app/shared";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { useLogin } from "./use-login.ts";
import { ApiError } from "../../lib/api-client.ts";

export const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ resolver: zodResolver(loginSchema) });

  const login = useLogin();

  const onSubmit = (values: LoginInput) => {
    login.mutate(values, {
      onError: (error) => {
        setError("root.server", {
          message:
            error instanceof ApiError ? error.message : "Couldn't connect. Please try again.",
        });
      },
    });
  };

  return (
    <main>
      <h1>Log in</h1>

      {errors.root?.server && <p role="alert">{errors.root.server.message}</p>}
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && <p id="email-error">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <p id="password-error">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={login.isPending}>
          {login.isPending ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
};
