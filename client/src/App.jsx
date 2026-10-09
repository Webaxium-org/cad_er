import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import SurveyLanding from "./pages/survey";
import RoadSurveyForm from "./pages/survey/RoadSurveyForm";
import ContinueSurveyForm from "./pages/survey/ContinueSurveyForm";
import RootLayout from "./layout/RootLayout";
import RoadSurveyRowsForm from "./pages/survey/RoadSurveyRowsForm";
import Unauthorized from "./pages/errors/Unauthorized";
import ServerError from "./pages/errors/ServerError";
import NotFound from "./pages/errors/NotFound";
import FieldBook from "./pages/survey/components/FieldBook";
import Report from "./pages/survey/Report";
import AreaReport from "./pages/survey/AreaReport";
import VolumeReport from "./pages/survey/VolumeReport";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import PublicRoute from "./routes/PublicRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import CrossSectionReport from "./pages/survey/CrossSectionReport";
import Profile from "./pages/user/Profile";
import OrganizationsDashboard from "./pages/organization";
import UsersDashboard from "./pages/user";
import LongitudinalSectionReport from "./pages/survey/LongitudinalSectionReport";
import ProjectsList from "./pages/survey/ProjectsList";
import CameraPage from "./pages/home/components/CameraPage";
import SelectEquipment from "./pages/survey/SelectEquipment";
import Quiz from "./pages/quiz";
import TicketsDashboard from "./pages/tickets";
import Followup from "./pages/tickets/Followup";
import OnboardingAccountType from "./pages/auth/OnboardingAccountType";
import OnboardingRoute from "./routes/OnboardingRoute";
import OurTeam from "./pages/public/OurTeam";
import About from "./pages/public/About";
import Careers from "./pages/public/Careers";
import Placements from "./pages/public/Placements";
import Pricing from "./pages/public/Pricing";
import PublicAppBarLayout from "./layout/PublicAppBarLayout";
import ImpactStats from "./pages/public/ImpactStats";
import PlottingAndQuantityReport from "./pages/survey/PlottingAndQuantityReport";
import Settings from "./pages/settings";
import Trash from "./pages/trash";
import ProposeLevel from "./pages/survey/ProposeLevel";
import LegalPage from "./pages/public/LegalPage";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicAppBarLayout />}>
            <Route path="/our-team" element={<OurTeam />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/placements" element={<Placements />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/impact" element={<ImpactStats />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
          </Route>

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />
          </Route>

          <Route element={<OnboardingRoute />}>
            <Route
              path="/onboarding/account-type"
              element={<OnboardingAccountType />}
            />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<RootLayout />}>
              <Route index element={<Home />} />
              <Route path="camera" element={<CameraPage />} />
              <Route path="profile" element={<Profile />} />

              {/* 🎓 STUDENT ONLY */}
              <Route path="quiz" element={<Quiz />} />

              {/* 🔐 ADMIN ONLY */}
              <Route
                element={<ProtectedRoute requiredRoles={["Super Admin"]} />}
              >
                <Route path="organizations">
                  <Route index element={<OrganizationsDashboard />} />
                </Route>
                <Route path="users">
                  <Route index element={<UsersDashboard />} />
                </Route>
              </Route>

              {/* 👷 PROFESSIONAL ONLY */}
              <Route
                element={<ProtectedRoute requiredTypes={["Professional"]} />}
              >
                <Route path="survey">
                  <Route index element={<ProjectsList />} />
                  <Route
                    path="select-equipment"
                    element={<SelectEquipment />}
                  />
                  <Route path="add-survey" element={<SurveyLanding />} />
                  <Route path=":id/propose-level" element={<ProposeLevel />} />
                  <Route path="report" element={<Report />} />
                  <Route path=":id/report" element={<Report />} />
                  <Route path="road-survey">
                    <Route index element={<RoadSurveyForm />} />
                    <Route path="continue-survey/:id" element={<ContinueSurveyForm />} />
                    <Route path=":id/rows" element={<RoadSurveyRowsForm />} />
                    <Route path=":id/field-book" element={<FieldBook />} />
                    <Route path=":id/report" element={<CrossSectionReport />} />
                    <Route
                      path=":id/longitudinal-report"
                      element={<LongitudinalSectionReport />}
                    />
                    <Route path=":id/area-report" element={<AreaReport />} />
                    <Route
                      path=":id/volume-report"
                      element={<VolumeReport />}
                    />
                    <Route
                      path=":id/plotting-and-quantity-report"
                      element={<PlottingAndQuantityReport />}
                    />
                  </Route>
                </Route>

                <Route path="tickets">
                  <Route index element={<TicketsDashboard />} />
                  <Route path=":id/followup" element={<Followup />} />
                </Route>
                
                <Route path="settings" element={<Settings />} />
                <Route path="trash" element={<Trash />} />
              </Route>

              {/* Errors */}
              <Route path="unauthorized" element={<Unauthorized />} />
              <Route path="server-error" element={<ServerError />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
