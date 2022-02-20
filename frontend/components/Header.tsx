import HelpIcon from '@mui/icons-material/Help';
import IconButton from '@mui/material/IconButton';
import React from 'react';
import styles from '../styles/Header.module.css';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { APP_VERSION } from '../common/constants';

const Left = () => {
  return (
    <div className={styles.headerLeft}>
      <Typography variant="subtitle2">Workspace</Typography>
    </div>
  );
};

const Right = () => {
  return (
    <div className={styles.headerRight}>
      {APP_VERSION}
      <Tooltip title="Help" placement="left">
        <IconButton size="small" onClick={() => {}}>
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
};

const Header = () => {
  return (
    <div className={styles.header}>
      <Left />
      <Right />
    </div>
  );
};

export default Header;
