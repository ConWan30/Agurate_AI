import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installChunkRecovery } from "./lib/chunk-recovery";

installChunkRecovery();

createRoot(document.getElementById("root")!).render(<App />);
