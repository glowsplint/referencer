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
import { COLOURS, ColourType, ColourValueType, REGEX } from "../../enums/enums";
import { mergeRanges, range } from "../utils";

import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CloseIcon from "@material-ui/icons/Close";
import ExpandMore from "@material-ui/icons/ExpandMore";
import FaceIcon from "@material-ui/icons/Face";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CreateIcon from "@material-ui/icons/Create";
import ShareIcon from "@material-ui/icons/Share";
import {
  HighlightIndices,
  HighlightIndicesChange,
  useHighlight,
  Interval,
} from "../../contexts/Highlight";

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

interface DataNode extends Node {
  data: string;
  dataset: {
    index: string;
  };
}

const Dot = ({ colour }: { colour: [ColourType, ColourValueType] }) => {
  // Clicking this component will update the Highlight Context which MainRegion is dependent on (need to configure this), triggering a re-render
  const { displayedTexts } = useTexts();
  const { highlightIndices, setHighlightIndices } = useHighlight();
  const colourStyle = { backgroundColor: colour[1] };
  const colourName = colour[0];

  // Write a function (Selection, OldHighlightIndices) => void that triggers setHighlightIndices(NewHighlightIndices)
  const generateNewIndices = (
    selection: Selection,
    oldHighlightIndices: HighlightIndices
  ): void => {
    // We determine which sections of the text to re-render with highlights here.
    // No support for cross-text highlighting.
    // 1. Determine what type of highlight it is.
    //    - Invalid highlight (highlight is across different textBodies)
    //    - Nil highlight (isCollapsed === true)
    //    - Within phrase highlight
    //    - Across phrase highlight
    const anchorNode = selection.anchorNode as DataNode;
    const focusNode = selection.focusNode as DataNode;
    const anchorOffset = selection.anchorOffset;
    const focusOffset = selection.focusOffset;
    if (
      anchorNode.parentElement.parentElement ===
        focusNode.parentElement.parentElement &&
      !selection.isCollapsed
    ) {
      // 2. Identify which node comes first by sorting on index and then offset
      const textAreaID = parseInt(anchorNode.parentElement.parentElement.id);
      const getPosition = (node: DataNode) =>
        parseInt(node.parentElement.dataset.index);
      let startNode: DataNode;
      let startOffset: number;
      let endNode: DataNode;
      let endOffset: number;
      let sameComponent = false;

      [startNode, endNode, startOffset, endOffset] = [
        anchorNode,
        focusNode,
        anchorOffset,
        focusOffset,
      ];
      if (getPosition(anchorNode) > getPosition(focusNode)) {
        [startNode, endNode, startOffset, endOffset] = [
          focusNode,
          anchorNode,
          focusOffset,
          anchorOffset,
        ];
      } else if (getPosition(anchorNode) === getPosition(focusNode)) {
        sameComponent = true;
        [startNode, endNode, startOffset, endOffset] = [
          anchorNode,
          focusNode,
          anchorOffset,
          focusOffset,
        ];
        if (anchorOffset > focusOffset) {
          [startNode, endNode, startOffset, endOffset] = [
            focusNode,
            anchorNode,
            focusOffset,
            anchorOffset,
          ];
        }
      }
      // Now, we have the startNode and endNode correctly sorted.
      // 2. Identify the [Start, End] indices for both the startNode and endNode
      let changedHighlights: HighlightIndicesChange = new Map<
        number,
        Interval
      >();
      if (sameComponent) {
        changedHighlights.set(getPosition(startNode), [startOffset, endOffset]);
      } else {
        changedHighlights.set(getPosition(startNode), [
          startOffset,
          displayedTexts.bodies[textAreaID].brokenText[getPosition(startNode)]
            .length,
        ]);
        changedHighlights.set(getPosition(endNode), [0, endOffset]);
        // 3. Determine if there are nodes in the middle, and fill them in too
        // Add a new entry for every string that exists within the range
        const middleRange = range(
          getPosition(endNode) - getPosition(startNode) - 1,
          getPosition(startNode) + 1
        );
        for (let index of middleRange) {
          const item = displayedTexts.bodies[textAreaID].brokenText[index];
          if (!item.match(REGEX.verseNumber)) {
            changedHighlights.set(index, [0, item.length]);
          }
        }
      }
      // 4. Take union of oldHighlightIndices with intermediateHighlightIndices to return newHighlightIndices
      // Take everything from oldHighlightIndices
      // For every key in intermediateHighlightIndices, if it exists in oldHighlightIndices, value = mergeRanges(value)
      if (!oldHighlightIndices.has(textAreaID)) {
        oldHighlightIndices.set(
          textAreaID,
          new Map<number, Map<ColourType, Interval[]>>()
        );
      }
      let textHighlightIndices = oldHighlightIndices.get(textAreaID);
      for (let [dataIndex, interval] of changedHighlights) {
        if (!textHighlightIndices.has(dataIndex)) {
          textHighlightIndices.set(
            dataIndex,
            new Map<ColourType, Interval[]>()
          );
        }
        let verseHighlightIndices = textHighlightIndices.get(dataIndex);
        if (!verseHighlightIndices.has(colourName)) {
          verseHighlightIndices.set(colourName, []);
        }
        let colourHighlightIndices = verseHighlightIndices.get(colourName);
        // TODO This is the part where we need to check for overlaps and resolve.
        colourHighlightIndices.push(interval);
        colourHighlightIndices.sort(([a0, a1], [b0, b1]) => {
          return a0 - a1;
        });
      }
      console.log(oldHighlightIndices);
      setHighlightIndices(oldHighlightIndices);
    }
  };

  return (
    <button
      className={styles.dot}
      onClick={() => {
        generateNewIndices(window.getSelection(), highlightIndices);
      }}
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

const LayerItems = () => {
  return (
    <div className={styles.layer_items}>
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
