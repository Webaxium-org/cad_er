import * as Yup from "yup";
import { Button, DialogActions, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { FiImage, FiSend } from "react-icons/fi";
import { useState } from "react";
import { handleFormError } from "../../../utils/handleFormError";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createTicket } from "../../../services/ticketServices";
import { showAlert } from "../../../redux/alertSlice";

const initialFormValues = {
  feedbackType: "",
  description: "",
};

const schema = Yup.object().shape({
  feedbackType: Yup.string()
    .oneOf(["Idea", "Glitch", "Evolution", "SOS", "Review"])
    .required("Feedback type is required"),
  description: Yup.string().required("Message is required"),
});

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#f8fafc",
    "& fieldset": { borderColor: "#e2e8f0" },
    "&:hover fieldset": { borderColor: "#6366f1" },
    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
  },
  "& .MuiInputLabel-root": { fontWeight: 600, color: "#64748b" },
};

const CreateTicket = ({ onClose }) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [formValues, setFormValues] = useState(initialFormValues);

  const [formErrors, setFormErrors] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);

  const handleInputChange = async (event) => {
    const { name, value } = event.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    try {
      await Yup.reach(schema, name).validate(value);

      setFormErrors({ ...formErrors, [name]: null });
    } catch (error) {
      setFormErrors({ ...formErrors, [name]: error.message });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await schema.validate(formValues, { abortEarly: false });

      const { data } = await createTicket(formValues, images);

      setFormValues(initialFormValues);
      setImages([]);

      dispatch(
        showAlert({
          type: "success",
          message: "Ticket created successfully",
        })
      );

      onClose(data.ticket);
    } catch (error) {
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <TextField
        select
        fullWidth
        label="Category"
        name="feedbackType"
        value={formValues.feedbackType}
        onChange={handleInputChange}
        error={Boolean(formErrors?.feedbackType)}
        helperText={formErrors?.feedbackType}
        sx={fieldSx}
      >
        {[
          { label: "💡 Idea (Suggestions)", value: "Idea" },
          { label: "🐛 Glitch (Bugs)", value: "Glitch" },
          { label: "🚀 Evolution (Features)", value: "Evolution" },
          { label: "🤝 SOS (Assistance)", value: "SOS" },
          { label: "✨ Review (Feedback)", value: "Review" },
        ].map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        multiline
        minRows={3}
        label="Message"
        name="description"
        placeholder="Enter your message"
        value={formValues.description}
        onChange={handleInputChange}
        error={Boolean(formErrors?.description)}
        helperText={formErrors?.description}
        sx={fieldSx}
      />
      <Button
        component="label"
        variant="outlined"
        startIcon={<FiImage />}
        sx={{
          borderRadius: "12px",
          border: "1px dashed #a5b4fc",
          color: "#4f46e5",
          bgcolor: "#f8fafc",
          py: 1.5,
          textTransform: "none",
          fontWeight: 700,
          "&:hover": { borderColor: "#6366f1", bgcolor: "#eef2ff" },
        }}
      >
        Attach images (optional, up to 5)
        <input
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(event) => {
            const selected = Array.from(event.target.files || []);
            if (
              selected.length > 5 ||
              selected.some((file) => file.size > 5 * 1024 * 1024)
            ) {
              setFormErrors((prev) => ({
                ...prev,
                images: "Select up to 5 images, each 5 MB or less",
              }));
              setImages([]);
            } else {
              setFormErrors((prev) => ({ ...prev, images: null }));
              setImages(selected);
            }
          }}
        />
      </Button>
      {images.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
          {images.map((file) => file.name).join(", ")}
        </Typography>
      )}
      {formErrors?.images && (
        <Typography color="error" variant="body2">
          {formErrors.images}
        </Typography>
      )}
      <DialogActions sx={{ mt: 1, px: 0, pb: 0, gap: 1.5 }}>
        {!isLoading && (
          <Button
            onClick={() => onClose()}
            variant="outlined"
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1.2,
              borderColor: "#cbd5e1",
              color: "#475569",
              fontWeight: 700,
              textTransform: "none",
              "&:hover": { borderColor: "#6366f1", bgcolor: "#f8fafc" },
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          loading={isLoading}
          variant="contained"
          startIcon={<FiSend />}
          sx={{
            borderRadius: "12px",
            px: 3,
            py: 1.2,
            bgcolor: "#6366f1",
            fontWeight: 800,
            textTransform: "none",
            boxShadow: "0 8px 20px rgba(99, 102, 241, 0.2)",
            "&:hover": { bgcolor: "#4f46e5" },
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Stack>
  );
};

export default CreateTicket;
