import { BrowserRouter as Router, Routes, Route } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";

// Public Pages
import LandingPage from "./pages/public/LandingPage";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import OrganizerApplication from "./pages/AuthPages/OrganizerApplication";
import NotFound from "./pages/OtherPage/NotFound";
import Unauthorized from "./pages/OtherPage/Unauthorized";

// Common Pages
import ProfilePage from "./pages/common/ProfilePage";
import SettingsPage from "./pages/common/SettingsPage";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentEvents from "./pages/student/StudentEvents";
import StudentEventDetails from "./pages/student/StudentEventDetails";
import StudentRegistrations from "./pages/student/StudentRegistrations";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentFeedback from "./pages/student/StudentFeedback";

// Organizer Pages
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import OrganizerEvents from "./pages/organizer/OrganizerEvents";
import OrganizerCreateEvent from "./pages/organizer/OrganizerCreateEvent";
import OrganizerEditEvent from "./pages/organizer/OrganizerEditEvent";
import OrganizerParticipants from "./pages/organizer/OrganizerParticipants";
import OrganizerFeedback from "./pages/organizer/OrganizerFeedback";
import OrganizerAnalytics from "./pages/organizer/OrganizerAnalytics";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminOrganizers from "./pages/admin/AdminOrganizers";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminDatabaseInsights from "./pages/admin/AdminDatabaseInsights";

// Existing TailAdmin Showcase Pages (Preserved)
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Alerts from "./pages/UiElements/Alerts";
import Avatars from "./pages/UiElements/Avatars";
import Badges from "./pages/UiElements/Badges";
import Buttons from "./pages/UiElements/Buttons";
import Images from "./pages/UiElements/Images";
import Videos from "./pages/UiElements/Videos";
import Blank from "./pages/Blank";

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/apply-organizer" element={<OrganizerApplication />} />
        <Route path="/organizer/apply" element={<OrganizerApplication />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Dashboard Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Common User Routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Student Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={["student", "admin"]} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/events" element={<StudentEvents />} />
              <Route path="/student/events/:id" element={<StudentEventDetails />} />
              <Route path="/student/registrations" element={<StudentRegistrations />} />
              <Route path="/student/attendance" element={<StudentAttendance />} />
              <Route path="/student/feedback" element={<StudentFeedback />} />
            </Route>

            {/* Organizer Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={["organizer", "admin"]} />}>
              <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
              <Route path="/organizer/events" element={<OrganizerEvents />} />
              <Route path="/organizer/events/create" element={<OrganizerCreateEvent />} />
              <Route path="/organizer/events/:id/edit" element={<OrganizerEditEvent />} />
              <Route path="/organizer/participants" element={<OrganizerParticipants />} />
              <Route path="/organizer/attendance" element={<OrganizerParticipants />} />
              <Route
                path="/organizer/events/:eventId/participants"
                element={<OrganizerParticipants />}
              />
              <Route path="/organizer/feedback" element={<OrganizerFeedback />} />
              <Route
                path="/organizer/events/:eventId/feedback"
                element={<OrganizerFeedback />}
              />
              <Route path="/organizer/analytics" element={<OrganizerAnalytics />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/organizers" element={<AdminOrganizers />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/registrations" element={<AdminRegistrations />} />
              <Route path="/admin/attendance" element={<AdminAttendance />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/database-insights" element={<AdminDatabaseInsights />} />
            </Route>

            {/* Preserved TailAdmin Demo Components */}
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/blank" element={<Blank />} />
          </Route>
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
