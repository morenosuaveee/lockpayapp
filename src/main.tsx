import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeChrome } from "./lib/native";

initNativeChrome();

createRoot(document.getElementById("root")!).render(<App />);
