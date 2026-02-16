import { Routes, Route, Navigate } from "react-router-dom";
import Chat from "./pages/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/authContext";
import Login from "./pages/login";

function App() {
  const { token } = useAuth();
  console.log("Token", token)

  return (
    <Routes>
      
      {/* Public Route */}
      <Route 
        path="/login" 
        element={token ? <Navigate to="/" /> : <Login />} 
      />

      {/* Private Route */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;
