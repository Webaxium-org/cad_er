import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { stopLoading } from "../../redux/loadingSlice";
import { useNavigate } from "react-router-dom";
import ProfessionalDashboard from "./components/ProfessionalDashboard";
import StudentDashboard from "./components/StudentDashboard";

const Home = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <>
      {user?.type === "Professional" ? (
        <ProfessionalDashboard user={user} />
      ) : (
        <StudentDashboard user={user} />
      )}
    </>
  );
};

export default Home;
