import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@messaging-app/shared";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { useLogin } from "./use-login.ts";
import { FormField } from "../../components/FormField.tsx";
import { applyServerErrors } from "../../lib/form-errors.ts";

const loginFields = ["email", "password"] as const;

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
      onError: (error) => applyServerErrors(error, setError, loginFields),
    });
  };

  return (
    <main>
      <h1>Log in</h1>

      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
        {errors.root?.server && <p role="alert">{errors.root.server.message}</p>}

        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register("email")}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          registration={register("password")}
        />

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
