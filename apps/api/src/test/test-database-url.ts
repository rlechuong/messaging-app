export const getTestDatabaseUrl = (): string => {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("DATABASE_URL is not set for tests");

  const databaseName = new URL(databaseUrl).pathname.slice(1);
  if (!databaseName.endsWith("_test")) {
    throw new Error(`Refusing to run tests against non-test database "${databaseName}"`);
  }

  return databaseUrl;
};
