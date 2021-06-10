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
import { useLogin } from "../../contexts/Login";
import { useTexts } from "../../contexts/Texts";

import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CloseIcon from "@material-ui/icons/Close";
import ExpandMore from "@material-ui/icons/ExpandMore";
import FaceIcon from "@material-ui/icons/Face";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CreateIcon from "@material-ui/icons/Create";
import ShareIcon from "@material-ui/icons/Share";
import { blue, green, orange, purple, yellow } from "@material-ui/core/colors";

const useStyles = makeStyles({
  input: {
    height: "20px",
    boxSizing: "border-box",
  },
});

const Checkbox = ({
  handleCheckBoxToggle,
  textHeader,
  id,
}: {
  handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  id: number;
  textHeader: string;
}) => {
  const { isDisplayed } = useTexts().texts;
  const checked = isDisplayed[id];
  const root = { root: useStyles().input };
  return (
    <MUICheckBox
      color="primary"
      classes={root}
      icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
      checkedIcon={<CheckBoxIcon fontSize="small" />}
      onChange={handleCheckBoxToggle}
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
        id={id}
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
  const { spaceID } = useLogin();
  const [displayedSpace, setDisplayedSpace] = useState(spaceID);

  const copyToClipboard = () => {
    const el = document.createElement("textarea");
    el.value = spaceID;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  };
  const onMouseDown = () => {
    setDisplayedSpace("Copied!");
  };
  const onMouseUp = () => {
    setDisplayedSpace(spaceID);
  };

  return (
    <div className={styles.top}>
      <Button
        onClick={copyToClipboard}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        size="small"
      >
        <span className={styles.top_spaceName}>{displayedSpace}</span>
        <span className={styles.top_icon}>
          <ShareIcon fontSize="small" />
        </span>
      </Button>
    </div>
  );
};

const dotColours = [
  orange[400],
  yellow[500],
  green[300],
  blue[300],
  purple[300],
];

const Dot = ({ colour }) => {
  const { texts, setTexts } = useTexts();
  const colourStyle = { backgroundColor: colour };
  // We determine which sections of the text to re-render with highlights here.
  // 1. Create a baseline to account for selection in the opposite direction
  // 2. Identify the splits for both the anchor and focus components
  // 3. If the anchor and focus components are the same component, then we only need to re-render one of the components
  // 4. If they are not, then we have to render the following groups of components: [Start, Middle (can be more than 1 component), End]
  // Clicking this button will update the Highlight Context which MainRegion is dependent on (need to configure this), triggering a re-render
  // First we need to determine how the render side will take in props
  return (
    <button
      className={styles.dot}
      onClick={() => {
        console.log(window.getSelection());
      }}
      style={colourStyle}
    ></button>
  );
};

const LayerItems = () => {
  return (
    <div className={styles.layer_items}>
      {dotColours.map((item, index) => {
        return <Dot colour={item} key={index} />;
      })}
    </div>
  );
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

const Profile = () => {
  const { displayName } = useLogin();
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
  const { displayName, setDisplayName } = useLogin();
  const [currentDisplayName, setCurrentDisplayName] =
    React.useState(displayName);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDone = () => {
    setDisplayName(currentDisplayName);
    setOpen(false);
  };

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCurrentDisplayName(event.target.value);
  };

  const handleChangeName = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleDone();
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
        <DialogTitle id="form-dialog-title">Change display name</DialogTitle>
        <DialogContent>
          <DialogContentText>Enter a new name.</DialogContentText>
          <form onSubmit={handleChangeName}>
            <TextField
              variant="outlined"
              autoFocus
              margin="dense"
              id="name"
              label="Display Name"
              fullWidth
              onChange={onChange}
            />
          </form>
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

export default function Settings({
  handleClose,
  handleCheckBoxToggle,
  isSettingsOpen,
}: {
  handleClose: (key: number) => void;
  handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isSettingsOpen: boolean;
}) {
  const textHeaders = useTexts().texts.headers;
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
        <Profile />
      </Paper>
    </div>
  );
}
