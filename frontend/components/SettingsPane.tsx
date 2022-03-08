import Button from '@mui/material/Button';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CloseIcon from '@mui/icons-material/Close';
import clsx from 'clsx';
import CreateIcon from '@mui/icons-material/Create';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import ExpandMore from '@mui/icons-material/ExpandMore';
import FaceIcon from '@mui/icons-material/Face';
import IconButton from '@mui/material/IconButton';
import MUICheckbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import React, { useState } from 'react';
import ShareIcon from '@mui/icons-material/Share';
import styles from '../styles/SettingsPane.module.css';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { baseAnnotations, useAnnotations } from '../contexts/Annotations';
import { Swatch } from './Swatch/Swatch';
import { useLogin } from '../contexts/Login';
import { useSettings } from '../contexts/Settings';
import { useTexts } from '../contexts/Texts';


const Checkbox = ({ textHeader, id }: { id: number; textHeader: string }) => {
  const { isDisplayed } = useTexts().texts;
  const { setTexts } = useTexts();
  const toggleTextAreaVisibility = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTexts((previous) => {
      const index = previous.headers.indexOf(event.target.name);
      let newIsDisplayed = [...previous.isDisplayed];
      newIsDisplayed[index] = !newIsDisplayed[index];
      return { ...previous, isDisplayed: newIsDisplayed };
    });
  };

  const checked = isDisplayed[id];
  return (
    <MUICheckbox
      color="primary"
      icon={<CheckBoxOutlineBlankIcon />}
      checkedIcon={<CheckBoxIcon />}
      onChange={toggleTextAreaVisibility}
      name={textHeader}
      checked={checked}
      size="small"
    />
  );
};

const SectionHeader = ({ text }: { text: string }) => {
  return (
    <div
      className={styles.sectionHeader}
      data-testid={`${text.toLowerCase()}SectionHeader`}
    >
      <ExpandMore fontSize="small" />
      <Typography variant="overline" display="block">
        {text}
      </Typography>
    </div>
  );
};

const TextItem = ({ textHeader, id }: { textHeader: string; id: number }) => {
  const { texts, setTexts } = useTexts();
  const { setAnnotations } = useAnnotations();
  const removeTextArea = (key: number) => {
    // Remove textHeaders and textBodies from text context
    const getNew = <T extends unknown>(oldArray: T[]) => [
      ...oldArray.slice(0, key),
      ...oldArray.slice(key + 1, oldArray.length),
    ];
    setTexts({
      headers: getNew(texts.headers),
      bodies: getNew(texts.bodies),
      isDisplayed: getNew(texts.isDisplayed),
    });

    /* Remove all annotations (highlights & arrows) of textAreaID (key)
       from annotations context */
    // Iterate over highlights
    // Look at intervalString, parse, see if start or end match the textAreaID
    // If match, remove the highlight

    // Iterate over arrows
    // Look at
    // setAnnotations((previous) => {
    //   return { ...previous, highlights: };
    // });
  };

  return (
    <div className={styles.textsItem}>
      <Checkbox textHeader={textHeader} id={id} />
      <div className={styles.textsText}>
        <Typography variant="overline" display="block">
          {textHeader}
        </Typography>
      </div>
      <IconButton size="small" disableRipple onClick={() => removeTextArea(id)}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>
  );
};

const TextItems = ({ textHeaders }: { textHeaders: string[] }) => {
  const items = textHeaders.map((text: string, index: number) => (
    <TextItem textHeader={text} key={index} id={index} />
  ));
  return <div className={styles.textsItems}>{items}</div>;
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
        <span className={styles.topSpaceName}>{displayedSpace}</span>
        <span className={styles.topIcon}>
          <ShareIcon fontSize="small" />
        </span>
      </Button>
    </div>
  );
};

const ClearAnnotationsButton = () => {
  const { setAnnotations } = useAnnotations();
  const clearAnnotations = () => {
    setAnnotations((previous) => {
      return {
        ...baseAnnotations,
        isPainterMode: previous.isPainterMode,
        activeColour: previous.activeColour,
      };
    });
  };

  return (
    <div className={styles.clearHighlights}>
      <Button
        variant="contained"
        onClick={clearAnnotations}
        data-testid="clearAnnotationsButton"
      >
        Clear annotations
      </Button>
    </div>
  );
};

const LayersItems = () => {
  return (
    <div className={styles.layersItems}>
      <Swatch />
      <ClearAnnotationsButton />
    </div>
  );
};

const MainRegion = ({ textHeaders }: { textHeaders: string[] }) => {
  return (
    <div className={styles.mainRegion}>
      <SectionHeader text="In Workspace" />
      <SectionHeader text="Texts" />
      <TextItems textHeaders={textHeaders} />
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

  const handleDone = () => {
    setLogin((previous) => {
      return { ...previous, displayName: currentDisplayName };
    });
    setOpen(false);
  };

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = event.target.value;
    if (newValue.length <= 20) setCurrentDisplayName(newValue);
  };

  const handleChangeName = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleDone();
  };

  return (
    <div>
      <Tooltip title="Settings" placement="left">
        <IconButton size="small" onClick={() => setOpen(true)}>
          <CreateIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Change display name</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a new name (limit of 20 characters).
          </DialogContentText>
          <form onSubmit={handleChangeName}>
            <TextField
              value={currentDisplayName}
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
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleDone} color="secondary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const SettingsPane = () => {
  const { texts } = useTexts();
  const { settings } = useSettings();

  return (
    <div
      className={clsx(styles.sideBar, {
        [styles.open]: settings.isSettingsOpen,
        [styles.closed]: !settings.isSettingsOpen,
      })}
      data-testid="settingsPane"
    >
      <Paper className={styles.paper} square>
        <Header />
        <MainRegion textHeaders={texts.headers} />
        <Profile />
      </Paper>
    </div>
  );
};

export default SettingsPane;
