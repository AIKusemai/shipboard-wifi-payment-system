import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from './components/Navbar';
import Login from "./Login";
import Register from "./Register";
import AdminRoute from './components/AdminRoute';
import { isTokenExpired } from './utils/auth';
import { moduleRoutes } from './modules';
import WifiPortalPage from './modules/wifi/pages/WifiPortalPage';

function App() {
  const isAuthenticated = () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return false;

    if (isTokenExpired(token)) {
      console.warn("Session expired. Purging local data.");
      localStorage.clear();
      return false;
    }
    return true;
  };

  const renderModuleElement = (route) => {
    const RouteComponent = route.component;
    const routeElement = <RouteComponent />;

    if (route.requireAdmin) {
      return <AdminRoute>{routeElement}</AdminRoute>;
    }

    if (route.requireAuth) {
      return isAuthenticated() ? routeElement : <Navigate to="/login" replace />;
    }

    return routeElement;
  };

  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={isAuthenticated() ? <WifiPortalPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/home"
          element={isAuthenticated() ? <WifiPortalPage /> : <Navigate to="/login" replace />}
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {moduleRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={renderModuleElement(route)}
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
