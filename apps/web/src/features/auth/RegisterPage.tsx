import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@messaging-app/shared";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { useRegister } from "./use-register.ts";
import { FormField } from "../../components/FormField.tsx";
import { applyServerErrors } from "../../lib/form-errors.ts";

const registerFields = ["email", "username", "password"] as const;

export const RegisterPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ resolver: zodResolver(registerSchema) });

  const registerMutation = useRegister();

  const onSubmit = (values: RegisterInput) => {
    registerMutation.mutate(values, {
      onError: (error) => applyServerErrors(error, setError, registerFields),
    });
  };

  return (
    <main>
      <h1>Register</h1>

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
          id="username"
          label="Username"
          type="text"
          autoComplete="username"
          error={errors.username?.message}
          registration={register("username")}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Registering..." : "Register"}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
};
