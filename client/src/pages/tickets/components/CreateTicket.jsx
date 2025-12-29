import * as Yup from "yup";
import { Button, Stack } from "@mui/material";
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
  feedbackType: Yup.string().required("Feedback type is required"),
  description: Yup.string().required("Message is required"),
});

const CreateTicket = ({ onClose }) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [formValues, setFormValues] = useState(initialFormValues);

  const [formErrors, setFormErrors] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

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

      const { data } = await createTicket(formValues);

      setFormValues(initialFormValues);

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
        label={"Feedback Type"}
        name={"feedbackType"}
        options={[
          { label: "Complaints", value: "Complaints" },
          { label: "Suggestions", value: "Suggestions" },
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

      <Stack direction={"row"} spacing={2} justifyContent="flex-end">
        {!isLoading && (
          <Button onClick={onClose} sx={{ p: 0 }}>
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
