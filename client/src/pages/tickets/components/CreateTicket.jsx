import * as Yup from "yup";
import { Button, Stack, Typography } from "@mui/material";
import BasicSelect from "../../../components/BasicSelect";
import BasicInput from "../../../components/BasicInput";
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
    <Stack spacing={2} mt={2}>
      <BasicSelect
        label={"Category"}
        name={"feedbackType"}
        options={[
          { label: "💡 Idea (Suggestions)", value: "Idea" },
          { label: "🐛 Glitch (Bugs)", value: "Glitch" },
          { label: "🚀 Evolution (Features)", value: "Evolution" },
          { label: "🤝 SOS (Assistance)", value: "SOS" },
          { label: "✨ Review (Feedback)", value: "Review" },
        ]}
        value={formValues?.feedbackType || ""}
        error={(formErrors && formErrors?.feedbackType) || ""}
        onChange={(e) => handleInputChange(e)}
      />
      <BasicInput
        label="Message"
        name="description"
        placeholder="Enter your message"
        value={formValues?.description || ""}
        error={(formErrors && formErrors?.description) || ""}
        onChange={(e) => handleInputChange(e)}
      />

      <Button component="label" variant="outlined">
        Attach images (optional, up to 5)
        <input hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => {
          const selected = Array.from(event.target.files || []);
          if (selected.length > 5 || selected.some((file) => file.size > 5 * 1024 * 1024)) {
            setFormErrors((prev) => ({ ...prev, images: "Select up to 5 images, each 5 MB or less" }));
            setImages([]);
          } else {
            setFormErrors((prev) => ({ ...prev, images: null }));
            setImages(selected);
          }
        }} />
      </Button>
      {images.length > 0 && <Typography variant="body2">{images.map((file) => file.name).join(", ")}</Typography>}
      {formErrors?.images && <Typography color="error" variant="body2">{formErrors.images}</Typography>}

      <Stack direction={"row"} spacing={2} justifyContent="flex-end">
        {!isLoading && (
          <Button onClick={() => onClose()} sx={{ p: 0 }}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} sx={{ p: 0 }} loading={isLoading}>
          Submit
        </Button>
      </Stack>
    </Stack>
  );
};

export default CreateTicket;
