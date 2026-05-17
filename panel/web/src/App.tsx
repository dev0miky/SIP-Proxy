import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme";
import { AuthGate } from "./components/AuthGate";

function Placeholder({ name }: { name: string }) {
  return <h1 className="text-lg font-semibold">{name}</h1>;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<div className="p-8">login form lands in T10</div>} />
          <Route element={<AuthGate />}>
            <Route index element={<Navigate to="/users" replace />} />
            <Route path="/users" element={<Placeholder name="Users" />} />
            <Route path="/regs" element={<Placeholder name="Registrations" />} />
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
