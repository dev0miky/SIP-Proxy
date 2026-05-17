import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme";
import { AuthGate } from "./components/AuthGate";
import Login from "./pages/Login";
import UsersPage from "./pages/Users";
import RegistrationsPage from "./pages/Registrations";

function Placeholder({ name }: { name: string }) {
  return <h1 className="text-lg font-semibold">{name}</h1>;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthGate />}>
            <Route index element={<Navigate to="/users" replace />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/regs" element={<RegistrationsPage />} />
            <Route path="/dids" element={<Placeholder name="DID map" />} />
            <Route path="/trunk" element={<Placeholder name="Trunk" />} />
            <Route path="/calls" element={<Placeholder name="Active calls" />} />
            <Route path="/history" element={<Placeholder name="Call history" />} />
            <Route path="/health" element={<Placeholder name="Health" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
