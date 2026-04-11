import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthScreen } from "./authScreen";
import { VolunteerArea } from "./volunteerArea";

function App() {
  const [isLogged, setIsLogged] = useState(false);

  return (
    <React.StrictMode>
      {isLogged ? (
        <VolunteerArea />
      ) : (
        <AuthScreen onLoginSuccess={() => setIsLogged(true)} />
      )}
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);