import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SurveyLanding from './pages/survey';
import RoadSurveyForm from './pages/survey/RoadSurveyForm';
import RootLayout from './layout/RootLayout';
import RoadSurveyRowsForm from './pages/survey/RoadSurveyRowsForm';
import Unauthorized from './pages/errors/Unauthorized';
import ServerError from './pages/errors/ServerError';
import NotFound from './pages/errors/NotFound';
import SurveyList from './pages/survey/SurveyList';
import FieldBook from './pages/survey/components/FieldBook';
import PurposeList from './pages/survey/PurposeList';
import Report from './pages/survey/Report';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<SurveyLanding />} />

            <Route path="survey">
              <Route index element={<SurveyList />} />

              <Route path="road-survey">
                <Route index element={<RoadSurveyForm />} />
                <Route path=":id/rows" element={<RoadSurveyRowsForm />} />

                <Route path=":id/field-book" element={<FieldBook />} />
                <Route path=":id/report" element={<Report />} />
              </Route>

              <Route path="purpose">
                <Route index element={<PurposeList />} />
              </Route>
            </Route>

            {/* Error Pages */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/server-error" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
