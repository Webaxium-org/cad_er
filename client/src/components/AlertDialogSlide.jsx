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
  submitDisabled = false,
  onCancel,
  onSubmit,
  paperSx = {},
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
        aria-describedby={description ? "alert-dialog-slide-description" : undefined}
        sx={{
          "& .MuiDialog-paper": {
            width: "calc(100% - 32px)",
            maxWidth: "600px",
            boxSizing: "border-box",
            ...paperSx,
          },
        }}
      >
        {title && (
          <DialogTitle sx={{ px: 4, pt: 3, pb: 1, fontWeight: 800, color: "#1e293b" }}>
            {title}
          </DialogTitle>
        )}
        <DialogContent sx={{ px: 4, pb: 3 }}>
          {description && (
            <DialogContentText id="alert-dialog-slide-description" sx={{ mb: 2 }}>
              {description}
            </DialogContentText>
          )}

          {content}
        </DialogContent>
        {(cancelButtonText || submitButtonText) && (
          <DialogActions sx={{ px: 4, pb: 3, pt: 0, gap: 1 }}>
            {cancelButtonText && (
              <Button
                onClick={onCancel}
                disabled={submitDisabled}
                variant="outlined"
                sx={{ borderRadius: "12px", borderColor: "#cbd5e1", color: "#475569", fontWeight: 700, textTransform: "none" }}
              >
                {cancelButtonText}
              </Button>
            )}
            {submitButtonText && (
              <Button
                onClick={onSubmit}
                disabled={submitDisabled}
                variant="contained"
                sx={{ borderRadius: "12px", bgcolor: "#6366f1", fontWeight: 800, textTransform: "none", "&:hover": { bgcolor: "#4f46e5" } }}
              >
                {submitButtonText}
              </Button>
            )}
          </DialogActions>
        )}
      </Dialog>
    </React.Fragment>
  );
}
