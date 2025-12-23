import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

const CourseUnlockModal = ({ open, course, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Unlock Full Course</DialogTitle>

      <DialogContent>
        <Typography fontWeight={600}>{course.title}</Typography>
        <Typography mt={1}>
          One-time payment to unlock all {course.videos.length} video classes.
        </Typography>

        <Typography mt={2} fontSize={20} fontWeight={700}>
          ₹{course.price}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained">Proceed to Pay</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseUnlockModal;
