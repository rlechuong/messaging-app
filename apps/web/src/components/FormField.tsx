import type { UseFormRegisterReturn } from "react-hook-form";

type FormFieldProps = {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  error: string | undefined;
  registration: UseFormRegisterReturn;
};

export const FormField = ({
  id,
  label,
  type,
  autoComplete,
  error,
  registration,
}: FormFieldProps) => {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...registration}
      />
      {error && <p id={errorId}>{error}</p>}
    </div>
  );
};
