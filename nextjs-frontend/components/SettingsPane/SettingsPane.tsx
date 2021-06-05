import React, { useState } from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import styles from "./SettingsPane.module.css";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import { Checkbox as MUICheckBox, Paper } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CloseIcon from "@material-ui/icons/Close";
import ExpandMore from "@material-ui/icons/ExpandMore";
import FaceIcon from "@material-ui/icons/Face";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CreateIcon from "@material-ui/icons/Create";
import ShareIcon from "@material-ui/icons/Share";

const useStyles = makeStyles({
  input: {
    height: "20px",
    boxSizing: "border-box",
  },
});

const Checkbox = ({
  handleCheckBoxToggle,
  textHeader,
}: {
  handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  textHeader: string;
}) => {
  const classes = useStyles();
  const [checked, setChecked] = useState(true);
  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleCheckBoxToggle(event);
    setChecked(!checked);
  };
  return (
    <MUICheckBox
      color="primary"
      classes={{ root: classes.input }}
      icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
      checkedIcon={<CheckBoxIcon fontSize="small" />}
      onChange={handleToggle}
      name={textHeader}
      checked={checked}
    />
  );
};

const SectionHeader = ({ text }: { text: string }) => {
  return (
    <div className={styles.sectionHeader}>
      <ExpandMore fontSize="small" />
      <Typography variant="overline" display="block">
        {text}
      </Typography>
    </div>
  );
};

const TextItem = ({
  textHeader,
  handleClose,
  id,
  handleCheckBoxToggle,
}: {
  textHeader: string;
  handleClose: (key: number) => void;
  id: number;
  handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div className={styles.texts_item}>
      <Checkbox
        handleCheckBoxToggle={handleCheckBoxToggle}
        textHeader={textHeader}
      />
      <div className={styles.texts_text}>
        <Typography variant="overline" display="block">
          {textHeader}
        </Typography>
      </div>
      <IconButton size="small" disableRipple onClick={() => handleClose(id)}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>
  );
};

const TextItems = ({
  textHeaders,
  handleClose,
  handleCheckBoxToggle,
}: {
  textHeaders: string[];
  handleClose: (key: number) => void;
  handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const items = textHeaders.map((text: string, index: number) => (
    <TextItem
      textHeader={text}
      handleClose={handleClose}
      key={index}
      id={index}
      handleCheckBoxToggle={handleCheckBoxToggle}
    />
  ));
  return <div className={styles.texts_items}>{items}</div>;
};

const Header = () => {
  return (
    <div className={styles.top}>
      <Button onClick={() => {}} size="small">
        <span className={styles.top_spaceName}>space-1</span>{" "}
        <span className={styles.top_icon}>
          <ShareIcon fontSize="small" />
        </span>
      </Button>
    </div>
  );
};

const LayerItems = () => {
  return <div></div>;
};

const MainRegion = ({
  textHeaders,
  handleClose,
  handleCheckBoxToggle,
}: {
  textHeaders: string[];
  handleClose: (key: number) => void;
  handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div className={styles.mainRegion}>
      <SectionHeader text="In Workspace" />
      <SectionHeader text="Texts" />
      <TextItems
        textHeaders={textHeaders}
        handleClose={handleClose}
        handleCheckBoxToggle={handleCheckBoxToggle}
      />
      <SectionHeader text="Layers" />
      <LayerItems />
    </div>
  );
};

const Profile = ({ displayName }: { displayName: string }) => {
  return (
    <div className={styles.profile}>
      <FaceIcon fontSize="small" />{" "}
      <span className={styles.name}>{displayName}</span>
      <ChangeNameButton />
    </div>
  );
};

const ChangeNameButton = () => {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDone = () => {
    setOpen(false);
  };

  return (
    <div>
      <Tooltip title="Settings" placement="left">
        <IconButton size="small" onClick={handleClickOpen}>
          <CreateIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">
          Change your screen display name
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a new name for the current workspace.
          </DialogContentText>
          <TextField
            variant="outlined"
            autoFocus
            margin="dense"
            id="name"
            label="Display Name"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleDone} color="secondary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default React.memo(
  ({
    textHeaders,
    handleClose,
    handleCheckBoxToggle,
    isSettingsOpen,
    displayName,
  }: {
    textHeaders: string[];
    handleClose: (key: number) => void;
    handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isSettingsOpen: boolean;
    displayName: string;
  }) => {
    return (
      <div
        className={clsx(styles.sidebar, {
          [styles.open]: isSettingsOpen,
          [styles.closed]: !isSettingsOpen,
        })}
      >
        <Paper className={styles.paper}>
          <Header />
          <MainRegion
            textHeaders={textHeaders}
            handleClose={handleClose}
            handleCheckBoxToggle={handleCheckBoxToggle}
          />
          <Profile displayName={displayName} />
        </Paper>
      </div>
    );
  }
);
