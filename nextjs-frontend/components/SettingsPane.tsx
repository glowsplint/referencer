import { COLOURS, ColourType, ColourValueType } from "../common/enums";
import {
  HighlightIndices,
  baseAnnotations,
  useAnnotation,
} from "../contexts/Annotations";
import React, { useState } from "react";

import Button from "@mui/material/Button";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CloseIcon from "@mui/icons-material/Close";
import CreateIcon from "@mui/icons-material/Create";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FaceIcon from "@mui/icons-material/Face";
import IconButton from "@mui/material/IconButton";
import MUICheckbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import ShareIcon from "@mui/icons-material/Share";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import styles from "../styles/SettingsPane.module.css";
import { useLogin } from "../contexts/Login";
import { useSettings } from "../contexts/Settings";
import { useTexts } from "../contexts/Texts";

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
    <MUICheckbox
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
    <div
      className={styles.section_header}
      data-testid={`${text.toLowerCase()}SectionHeader`}
    >
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
  const { login } = useLogin();
  const [displayedSpace, setDisplayedSpace] = useState(login.spaceID);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(login.spaceID);
  };
  const onMouseDown = () => {
    setDisplayedSpace("Copied!");
  };
  const onMouseUp = () => {
    setDisplayedSpace(login.spaceID);
  };

  return (
    <div className={styles.top}>
      <Button
        onClick={copyToClipboard}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        size="small"
        data-testid="spaceButton"
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
  const { setAnnotations } = useAnnotation();

  const colourStyle = { backgroundColor: colour[1] };
  const handleClick = () => {
    setAnnotations((prevAnnotations) => {
      return {
        ...prevAnnotations,
        highlights: {
          ...prevAnnotations.highlights,
          finished: [
            ...prevAnnotations.highlights.finished,
            {
              anchor: {
                start: prevAnnotations.selection.start,
                end: prevAnnotations.selection.end,
              },
              target: {
                start: prevAnnotations.selection.start,
                end: prevAnnotations.selection.end,
              },
              colour: colour[0].toLowerCase(),
            },
          ],
        },
      };
    });
  };

  return (
    <button className={styles.dot} onClick={handleClick} style={colourStyle} />
  );
};

const ClearAnnotationsButton = () => {
  const { setAnnotations } = useAnnotation();
  const handleClick = () => {
    setAnnotations((prevAnnotations) => {
      return { ...prevAnnotations, ...baseAnnotations };
    });
  };

  return (
    <div className={styles.clear_highlights}>
      <Button
        variant="contained"
        onClick={handleClick}
        data-testid="clearAnnotationsButton"
      >
        Clear annotations
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
      <ClearAnnotationsButton />
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
  const { login } = useLogin();
  return (
    <div className={styles.profile}>
      <FaceIcon fontSize="small" />
      <span className={styles.name}>{login.displayName}</span>
      <ChangeNameButton />
    </div>
  );
};

const ChangeNameButton = () => {
  const [open, setOpen] = React.useState(false);
  const { login, setLogin } = useLogin();
  const [currentDisplayName, setCurrentDisplayName] = React.useState(
    login.displayName
  );

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDone = () => {
    setLogin((prevLogin) => {
      return { ...prevLogin, displayName: currentDisplayName };
    });
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

const SettingsPane = () => {
  const { texts, setTexts } = useTexts();
  const { settings } = useSettings();
  const handleClose = (key: number) => {
    const getNew = (oldArray: any[]) => [
      ...oldArray.slice(0, key),
      ...oldArray.slice(key + 1, oldArray.length),
    ];
    setTexts({
      headers: getNew(texts.headers),
      bodies: getNew(texts.bodies),
      isDisplayed: getNew(texts.isDisplayed),
    });
  };

  const handleCheckBoxToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const index = texts.headers.indexOf(event.target.name);
    let newIsDisplayed = [...texts.isDisplayed];
    newIsDisplayed[index] = !newIsDisplayed[index];
    setTexts({ ...texts, isDisplayed: newIsDisplayed });
  };

  return (
    <div
      className={clsx(styles.sidebar, {
        [styles.open]: settings.isSettingsOpen,
        [styles.closed]: !settings.isSettingsOpen,
      })}
      data-testid="settingsPane"
    >
      <Paper className={styles.paper}>
        <Header />
        <MainRegion
          textHeaders={texts.headers}
          handleClose={handleClose}
          handleCheckBoxToggle={handleCheckBoxToggle}
        />
        <Profile />
      </Paper>
    </div>
  );
};

export default SettingsPane;