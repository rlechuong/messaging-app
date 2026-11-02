import { ApiError } from "./api-client.ts";

export const applyServerErrors = <TField extends string>(
  error: unknown,
  setError: (name: TField | "root.server", error: { message: string }) => void,
  fields: readonly TField[],
) => {
  const isField = (field: string): field is TField => (fields as readonly string[]).includes(field);

  if (!(error instanceof ApiError)) {
    setError("root.server", { message: "Couldn't connect. Please try again." });
    return;
  }

  let hasFieldError = false;
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    const message = messages[0];
    if (isField(field) && message) {
      setError(field, { message });
      hasFieldError = true;
    }
  }

  if (!hasFieldError) {
    setError("root.server", { message: error.message });
  }
};
