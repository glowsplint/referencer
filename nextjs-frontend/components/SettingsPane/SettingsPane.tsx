import React, { useState } from "react";
import clsx from "clsx";
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
import { COLOURS, ColourType, ColourValueType } from "../../enums/enums";

import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CloseIcon from "@material-ui/icons/Close";
import ExpandMore from "@material-ui/icons/ExpandMore";
import FaceIcon from "@material-ui/icons/Face";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CreateIcon from "@material-ui/icons/Create";
import ShareIcon from "@material-ui/icons/Share";
import { useHighlight } from "../../contexts/Highlight";

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
  return (
    <MUICheckBox
      color="primary"
      icon={<CheckBoxOutlineBlankIcon />}
      checkedIcon={<CheckBoxIcon />}
      onChange={handleCheckBoxToggle}
      name={textHeader}
      checked={checked}
      size="small"
    />
  );
};

const SectionHeader = ({ text }: { text: string }) => {
  return (
    <div className={styles.section_header}>
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

const Dot = ({ colour }: { colour: [ColourType, ColourValueType] }) => {
  const colourStyle = { backgroundColor: colour[1] };

  return (
    <button
      className={styles.dot}
      onClick={() => {}}
      style={colourStyle}
    ></button>
  );
};

const ClearHighlightsButton = () => {
  const { resetHighlightIndices } = useHighlight();
  const handleClearHighlights = () => {
    resetHighlightIndices();
  };
  return (
    <div className={styles.clear_highlights}>
      <Button variant="contained" onClick={handleClearHighlights}>
        Clear Highlights
      </Button>
    </div>
  );
};

const LayersItems = () => {
  return (
    <div className={styles.layers_items}>
      {Object.entries(COLOURS).map((item, index: number) => {
        return (
          <Dot colour={item as [ColourType, ColourValueType]} key={index} />
        );
      })}
      <ClearHighlightsButton />
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
      <LayersItems />
    </div>
  );
};

const Profile = () => {
  const { displayName } = useLogin();
  return (
    <div className={styles.profile}>
      <FaceIcon fontSize="small" />
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
