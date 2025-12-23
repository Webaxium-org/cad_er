import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  LinearProgress,
  Stack,
} from "@mui/material";
import { useState } from "react";

import { quizQuestions } from "../constants";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { submitQuiz } from "../services/userServices";
import { handleFormError } from "../utils/handleFormError";
import { setUser } from "../redux/userSlice";
import BasicButton from "./BasicButton";

const getResultMessage = (score, total) => {
  const percentage = Math.round((score / total) * 100);

  if (percentage >= 90) {
    return {
      title: "Outstanding! 🎯",
      message:
        "You’ve shown excellent understanding. You're ready to master the course!",
      discount: 50,
    };
  }

  if (percentage >= 70) {
    return {
      title: "Great Job! 🚀",
      message:
        "You have a strong foundation. This course will take you to the next level.",
      discount: 40,
    };
  }

  if (percentage >= 50) {
    return {
      title: "Good Effort! 👍",
      message:
        "You’re on the right track. A little guidance will make a big difference.",
      discount: 30,
    };
  }

  return {
    title: "Nice Try! 💡",
    message:
      "Don’t worry—this course is designed to help you learn from scratch.",
    discount: 20,
  };
};

export default function QuizStepper() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = quizQuestions[activeStep];

  const handleAnswerChange = (e) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: Number(e.target.value),
    }));
  };

  const handleNext = () => {
    if (activeStep === quizQuestions.length - 1) {
      finishQuiz();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const finishQuiz = async () => {
    try {
      let total = 0;
      quizQuestions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) total++;
      });

      setScore(total);
      setFinished(true);

      const { data } = await submitQuiz({
        score: total,
        completedQuestions: Object.keys(answers),
      });

      if (data.success) {
        const updatedUser = {
          ...user,
          isQuizCompleted: data.isQuizCompleted,
          quizScore: data.quizScore,
        };

        dispatch(setUser(updatedUser));
      } else {
        throw Error("Failed to fetch purposes");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  if (finished) {
    const { title, message, discount } = getResultMessage(
      score,
      quizQuestions.length
    );

    return (
      <Box sx={{ maxWidth: 420, mx: "auto", mt: 6, px: 1 }}>
        <Card>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h5" fontWeight={600}>
              🎉 Quiz Completed
            </Typography>

            <Typography mt={2} variant="h6">
              {title}
            </Typography>

            <Typography mt={1} color="text.secondary">
              {message}
            </Typography>

            <Typography mt={3} variant="h4" color="primary">
              {score} / {quizQuestions.length}
            </Typography>

            <Box
              my={3}
              sx={{
                bgcolor: "success.light",
                color: "success.contrastText",
                p: 2,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                🎁 You got a {discount}% discount!
              </Typography>

              <Typography variant="body2" mt={1}>
                Continue to home page to unlock the course.
              </Typography>
            </Box>

            <BasicButton
              fullWidth={true}
              value={"Continue"}
              onClick={() => navigate("/")}
            />
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 4, px: 1 }}>
      {/* Progress */}
      <Typography variant="body2" color="text.secondary">
        Question {activeStep + 1} of {quizQuestions.length}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={((activeStep + 1) / quizQuestions.length) * 100}
        sx={{ my: 1, height: 6, borderRadius: 3 }}
      />

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            {currentQuestion.question}
          </Typography>

          <RadioGroup
            value={answers[currentQuestion.id] ?? ""}
            onChange={handleAnswerChange}
          >
            <Stack spacing={1}>
              {currentQuestion.options.map((opt, index) => (
                <FormControlLabel
                  key={index}
                  value={index}
                  control={<Radio />}
                  label={<Typography variant="body1">{opt}</Typography>}
                />
              ))}
            </Stack>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Actions */}
      <Stack direction="row" spacing={1} mt={2}>
        <Button
          fullWidth
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
        >
          Back
        </Button>

        <Button
          fullWidth
          variant="contained"
          disabled={answers[currentQuestion.id] === undefined}
          onClick={handleNext}
        >
          {activeStep === quizQuestions.length - 1 ? "Finish" : "Next"}
        </Button>
      </Stack>
    </Box>
  );
}
