import styles from "../../styles/SettingsPane.module.css";
import Typography from "@material-ui/core/Typography";
import ExpandMore from "@material-ui/icons/ExpandMore";
import PersonAddIcon from "@material-ui/icons/PersonAdd";

function Collapsible({ text }) {
  return (
    <div className={styles.sidebar_participants}>
      <div className={styles.sidebar_header}>
        <ExpandMore fontSize="small" />
        <Typography variant="overline" display="block">
          {text}
        </Typography>
      </div>
    </div>
  );
}

export default function SettingsPane() {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebar_top}>
        <Typography variant="button">space-1</Typography>
        <PersonAddIcon />
      </div>
      <Collapsible text="In Workspace" />
      <Collapsible text="Texts" />
      <Collapsible text="Layers" />
    </div>
  );
}
