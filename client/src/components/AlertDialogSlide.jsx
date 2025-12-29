import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function AlertDialogSlide({
  open,
  title,
  description,
  content,
  cancelButtonText,
  submitButtonText,
  onCancel,
  onSubmit,
}) {
  return (
    <React.Fragment>
      <Dialog
        open={open}
        slots={{
          transition: Transition,
        }}
        keepMounted
        onClose={onCancel}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            {description}
          </DialogContentText>

          {content}
        </DialogContent>
        {(onCancel || onSubmit) && (
          <DialogActions>
            <Button onClick={onCancel}>{cancelButtonText}</Button>
            <Button onClick={onSubmit}>{submitButtonText}</Button>
          </DialogActions>
        )}
      </Dialog>
    </React.Fragment>
  );
}
