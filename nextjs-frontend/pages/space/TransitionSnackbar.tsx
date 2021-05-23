import React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import Grow from "@material-ui/core/Grow";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";

export default function TransitionSnackbar({
  open,
  onClose,
  message,
}: {
  open: boolean;
  onClose;
  message: string;
}) {
  return (
    <div>
      <Snackbar
        open={open}
        onClose={onClose}
        TransitionComponent={Grow}
        autoHideDuration={4000}
        message={message}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        key={message}
        action={
          <React.Fragment>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </React.Fragment>
        }
      />
    </div>
  );
}
