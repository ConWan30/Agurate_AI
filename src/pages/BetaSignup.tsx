import { Navigate } from "react-router-dom";

/** Beta enrollment is retired. Public users now enter through normal account access. */
export default function BetaSignup() {
  return <Navigate to="/auth" replace />;
}
