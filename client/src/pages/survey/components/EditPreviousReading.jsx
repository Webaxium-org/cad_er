import { Box } from '@mui/material';
import AlertDialogSlide from '../../../components/AlertDialogSlide';
import { GrInProgress } from 'react-icons/gr';

const alertData = {
  title: 'Edit Previous Reading',
  description: '',
  content: (
    <Box>
      <GrInProgress /> In Progress
    </Box>
  ),
  cancelButtonText: 'Cancel',
  submitButtonText: 'Update',
};

const EditPreviousReading = ({ open, onCancel, onSubmit }) => {
  return (
    <AlertDialogSlide
      {...alertData}
      open={open}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
};

export default EditPreviousReading;
