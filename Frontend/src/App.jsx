import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerificationDashboard from "./pages/dashboard/VerificationDashboard.jsx";
import SeniorReviewPage from "./pages/dashboard/SeniorReviewPage.jsx";
import BarangayManagementPage from "./pages/dashboard/BarangayManagementPage.jsx";
import StaffManagementPage from "./pages/dashboard/StaffManagementPage.jsx";
import PensionManagementPage from "./pages/dashboard/PensionManagementPage.jsx";
import BenefitsManagementPage from "./pages/dashboard/BenefitsManagementPage.jsx";
import AnnouncementsManagementPage from "./pages/dashboard/AnnouncementsManagementPage.jsx";
import ActivitiesManagementPage from "./pages/dashboard/ActivitiesManagementPage.jsx";
import ConcernsManagementPage from "./pages/dashboard/ConcernsManagementPage.jsx";
import SeniorDashboard from "./pages/senior/SeniorDashboard.jsx";
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

        {/* Senior Citizen's own service dashboard. */}
        <Route
          path="/senior/dashboard"
          element={
            <ProtectedRoute allowedRoles={["SENIOR_CITIZEN"]}>
              <SeniorDashboard />
            </ProtectedRoute>
          }
        />

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

        {/* Barangay/Admin/LGU-OSCA pension management — same role set as verification. */}
        <Route
          path="/pension-management"
          element={
            <ProtectedRoute allowedRoles={VERIFICATION_ROLES}>
              <PensionManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Barangay/Admin/LGU-OSCA Benefits & Assistance management — same role set as verification. */}
        <Route
          path="/benefits-management"
          element={
            <ProtectedRoute allowedRoles={VERIFICATION_ROLES}>
              <BenefitsManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Barangay/Admin/LGU-OSCA Announcements management — same role set as verification. */}
        <Route
          path="/announcements-management"
          element={
            <ProtectedRoute allowedRoles={VERIFICATION_ROLES}>
              <AnnouncementsManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Barangay/Admin/LGU-OSCA Social Activities management — same role set as verification. */}
        <Route
          path="/activities-management"
          element={
            <ProtectedRoute allowedRoles={VERIFICATION_ROLES}>
              <ActivitiesManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Barangay/Admin/LGU-OSCA Reports/Concerns management — same role set as verification. */}
        <Route
          path="/concerns-management"
          element={
            <ProtectedRoute allowedRoles={VERIFICATION_ROLES}>
              <ConcernsManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Admin-only organizational management. */}
        <Route
          path="/admin/barangays"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <BarangayManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <StaffManagementPage />
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
