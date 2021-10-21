import HelpIcon from "@mui/icons-material/Help";
import IconButton from "@mui/material/IconButton";
import React from "react";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import styles from "../styles/Header.module.css";

const HeaderLeft = React.memo(() => {
  return (
    <div className={styles.headerLeft}>
      <Typography variant="subtitle2">Workspace</Typography>
    </div>
  );
});

const HeaderRight = React.memo(() => {
  return (
    <div className={styles.headerRight}>
      <Tooltip title="Help" placement="left">
        <IconButton size="small" onClick={() => {}}>
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
});

const Header = React.memo(() => {
  return (
    <div className={styles.header}>
      <HeaderLeft />
      <HeaderRight />
    </div>
  );
});

export default Header;
