import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import SurveyLanding from "./pages/survey";
import RoadSurveyForm from "./pages/survey/RoadSurveyForm";
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
import Landing from "./pages/landing";
import Quiz from "./pages/quiz";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />
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
                  <Route path="report" element={<Report />} />
                  <Route path=":id/report" element={<Report />} />
                  <Route path="road-survey">
                    <Route index element={<RoadSurveyForm />} />
                    <Route path=":id" element={<RoadSurveyForm />} />
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
                  </Route>
                </Route>
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
