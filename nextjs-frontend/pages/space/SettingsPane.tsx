import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import styles from "../../styles/SettingsPane.module.css";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";

// Icons
import ExpandMore from "@material-ui/icons/ExpandMore";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import CloseIcon from "@material-ui/icons/Close";
import { Checkbox as MUICheckBox } from "@material-ui/core";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

const useStyles = makeStyles({
  input: {
    height: "20px",
    boxSizing: "border-box", // <-- add this
  },
});

function Checkbox() {
  const classes = useStyles();
  return (
    <MUICheckBox
      color="primary"
      classes={{ root: classes.input }}
      icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
      checkedIcon={<CheckBoxIcon fontSize="small" />}
    />
  );
}

function SectionHeader({ text }) {
  return (
    <div className={styles.sidebar_main}>
      <div className={styles.sidebar_main_header}>
        <ExpandMore fontSize="small" />
        <Typography variant="overline" display="block">
          {text}
        </Typography>
      </div>
    </div>
  );
}

function TextItem({ text, handleClose, id }) {
  return (
    <div className={styles.texts_item}>
      <Checkbox />
      <div className={styles.texts_text}>
        <Typography variant="overline" display="block">
          {text}
        </Typography>
      </div>
      <IconButton
        size="small"
        color="primary"
        disableRipple
        onClick={() => handleClose(id)}
      >
        <div className={styles.texts_icon}>
          <CloseIcon fontSize="small" />
        </div>
      </IconButton>
    </div>
  );
}

function TextItems({ texts, handleClose }) {
  const items = texts.map((text: string, index: number) => (
    <TextItem text={text} handleClose={handleClose} key={index} id={index} />
  ));
  return <div className={styles.texts_items}>{items}</div>;
}

export default function SettingsPane({ texts, handleClose }) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebar_top}>
        <Typography variant="button">space-1</Typography>
        <PersonAddIcon />
      </div>
      <SectionHeader text="In Workspace" />
      <SectionHeader text="Texts" />
      <TextItems texts={texts} handleClose={handleClose} />
      <SectionHeader text="Layers" />
    </div>
  );
}