import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./styles.css";
import "./journal.css";

// A data router enables the editor's unsaved-work guard, including browser Back.
const router = createBrowserRouter([{ path: "*", element: <App /> }]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
