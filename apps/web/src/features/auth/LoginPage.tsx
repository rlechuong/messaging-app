import { Link } from "react-router";

export const LoginPage = () => (
  <main>
    <h1>Log in</h1>
    <p>
      Don't have an account? <Link to="/register">Register</Link>
    </p>
  </main>
);
