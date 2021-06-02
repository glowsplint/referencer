import React, { useState } from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import styles from "../styles/SettingsPane.module.css";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";

import ExpandMore from "@material-ui/icons/ExpandMore";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import CloseIcon from "@material-ui/icons/Close";
import { Checkbox as MUICheckBox, Paper } from "@material-ui/core";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import Tooltip from "@material-ui/core/Tooltip";

const useStyles = makeStyles({
  input: {
    height: "20px",
    boxSizing: "border-box",
  },
});

function Checkbox({
  handleCheckBoxToggle,
  textHeader,
}: {
  handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  textHeader: string;
}) {
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
}

function SectionHeader({ text }: { text: string }) {
  return (
    <div className={styles.sidebar_main}>
      <ExpandMore fontSize="small" />
      <Typography variant="overline" display="block">
        {text}
      </Typography>
    </div>
  );
}

function TextItem({
  textHeader,
  handleClose,
  id,
  handleCheckBoxToggle,
}: {
  textHeader: string;
  handleClose: (key: number) => void;
  id: number;
  handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
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
}

function TextItems({
  textHeaders,
  handleClose,
  handleCheckBoxToggle,
}: {
  textHeaders: string[];
  handleClose: (key: number) => void;
  handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
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
}

function Header() {
  return (
    <div className={styles.sidebar_top}>
      <Typography variant="button">space-1</Typography>
      <Tooltip title="Add users" placement="left">
        <IconButton size="small" onClick={() => {}}>
          <PersonAddIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
}

export default function SettingsPane({
  textHeaders,
  handleClose,
  handleCheckBoxToggle,
  isSettingsOpen,
}: {
  textHeaders: string[];
  handleClose: (key: number) => void;
  handleCheckBoxToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isSettingsOpen: boolean;
}) {
  return (
    <div
      className={clsx(styles.sidebar, {
        [styles.open]: isSettingsOpen,
        [styles.closed]: !isSettingsOpen,
      })}
    >
      <Paper className={styles.paper}>
        <Header />
        <SectionHeader text="In Workspace" />
        <SectionHeader text="Texts" />
        <TextItems
          textHeaders={textHeaders}
          handleClose={handleClose}
          handleCheckBoxToggle={handleCheckBoxToggle}
        />
        <SectionHeader text="Layers" />
      </Paper>
    </div>
  );
}
