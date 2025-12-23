import { useEffect } from "react";
import QuizStepper from "../../components/QuizStepper";
import { useDispatch } from "react-redux";
import { stopLoading } from "../../redux/loadingSlice";
import SmallHeader from "../../components/SmallHeader";
import { Box } from "@mui/material";

const Quiz = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <>
      <SmallHeader />
      <Box className="overlapping-header">
        <QuizStepper />
      </Box>
    </>
  );
};

export default Quiz;
