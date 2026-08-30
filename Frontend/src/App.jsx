import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerificationDashboard from "./pages/dashboard/VerificationDashboard.jsx";
import SeniorReviewPage from "./pages/dashboard/SeniorReviewPage.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
// import Dashboard from "./pages/Dashboard";
// import Profile from "./pages/Profile";
// import NotFound from "./pages/NotFound";

// Roles authorized to use the Barangay/Admin verification workflow —
// mirrors `staffOrAbove` in Backend/src/routes/verification.routes.js.
const VERIFICATION_ROLES = ["BARANGAY_STAFF", "ADMIN", "LGU_OSCA"];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Barangay/Admin/LGU-OSCA verification workflow. Each role lands
            on the same dashboard component — access is enforced by the
            backend regardless of which URL is used. */}
        <Route
          path="/barangay/dashboard"
          element={
            <ProtectedRoute allowedRoles={VERIFICATION_ROLES}>
              <VerificationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={VERIFICATION_ROLES}>
              <VerificationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lgu/dashboard"
          element={
            <ProtectedRoute allowedRoles={VERIFICATION_ROLES}>
              <VerificationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification/:id"
          element={
            <ProtectedRoute allowedRoles={VERIFICATION_ROLES}>
              <SeniorReviewPage />
            </ProtectedRoute>
          }
        />

        {/* <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
