import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { stopLoading } from "../../redux/loadingSlice";
import { useNavigate } from "react-router-dom";
import ProfessionalDashboard from "./components/ProfessionalDashboard";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { getDashboard } from "../../services/indexServices";
import { handleFormError } from "../../utils/handleFormError";

const Home = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const { data } = await getDashboard();
      setData(data?.stats);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      {user?.type === "Professional" ? (
        user.role === "Super Admin" ? (
          <AdminDashboard user={user} data={data} />
        ) : (
          <ProfessionalDashboard user={user} data={data} />
        )
      ) : (
        <StudentDashboard user={user} data={data} />
      )}
    </>
  );
};

export default Home;
