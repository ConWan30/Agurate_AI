import { Navigate } from "react-router-dom";

/** Delta Intelligence is retired from the public product. */
export default function DeltaIntelligence() {
  return <Navigate to="/dashboard" replace />;
}
