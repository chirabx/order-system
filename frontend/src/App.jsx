import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ScanOrder from "./pages/ScanOrder.jsx";
import OrderStatus from "./pages/OrderStatus.jsx";
import Profile from "./pages/Profile.jsx";
import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import StaffOrders from "./pages/staff/StaffOrders.jsx";
import StaffTables from "./pages/staff/StaffTables.jsx";
import StaffMenu from "./pages/staff/StaffMenu.jsx";
import CustomerHome from "./pages/CustomerHome.jsx";
import CustomerOrders from "./pages/CustomerOrders.jsx";
import Comments from "./pages/Comments.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Skeleton from "./components/Skeleton.jsx";

function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      exit={{ opacity: 0, clipPath: "inset(100% 0 0 0)" }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      style={{ transformOrigin: "top" }}
      className="min-h-[calc(100vh-96px)]"
    >
      {children}
    </motion.div>
  );
}

function homeFor(user) {
  if (!user) return "/login";
  return user.role === "staff" ? "/staff/dashboard" : "/customer";
}

function RedirectIfAuthed({ children }) {
  const { user, initialized } = useAuth();
  if (!initialized) return <Skeleton className="h-72" />;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function RequireAuth({ children, role }) {
  const { user, initialized } = useAuth();
  if (!initialized) return <Skeleton className="h-72" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <Shell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to={homeFor(user)} replace />} />
          <Route path="/login" element={<Page><RedirectIfAuthed><Login /></RedirectIfAuthed></Page>} />
          <Route path="/register" element={<Page><RedirectIfAuthed><Register /></RedirectIfAuthed></Page>} />
          <Route path="/customer" element={<Page><RequireAuth role="customer"><CustomerHome /></RequireAuth></Page>} />
          <Route path="/customer/orders" element={<Page><RequireAuth role="customer"><CustomerOrders /></RequireAuth></Page>} />
          <Route path="/comments" element={<Page><RequireAuth><Comments /></RequireAuth></Page>} />
          <Route path="/scan/:tableId" element={<Page><ScanOrder /></Page>} />
          <Route path="/order-status/:orderId" element={<Page><RequireAuth><OrderStatus /></RequireAuth></Page>} />
          <Route path="/profile" element={<Page><RequireAuth><Profile /></RequireAuth></Page>} />
          <Route path="/staff/dashboard" element={<Page><RequireAuth role="staff"><StaffDashboard /></RequireAuth></Page>} />
          <Route path="/staff/orders" element={<Page><RequireAuth role="staff"><StaffOrders /></RequireAuth></Page>} />
          <Route path="/staff/tables" element={<Page><RequireAuth role="staff"><StaffTables /></RequireAuth></Page>} />
          <Route path="/staff/menu" element={<Page><RequireAuth role="staff"><StaffMenu /></RequireAuth></Page>} />
          <Route path="/staff/profile" element={<Page><RequireAuth role="staff"><Profile /></RequireAuth></Page>} />
        </Routes>
      </AnimatePresence>
    </Shell>
  );
}
