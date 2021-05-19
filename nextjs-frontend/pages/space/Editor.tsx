import styles from "../../styles/Editor.module.css";
import DesktopWindowsIcon from "@material-ui/icons/DesktopWindows";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";
import HelpIcon from "@material-ui/icons/Help";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import books from "./autocomplete";

function SearchBar() {
  return (
    <Autocomplete
      id="autocomplete"
      freeSolo
      fullWidth
      options={books}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search"
          size="small"
          margin="normal"
          variant="outlined"
        />
      )}
    />
  );
}

export default function App() {
  return (
    <div className={styles.editor}>
      <div className={styles.editor_header}>
        <div className={styles.editor_header_left}>
          <DesktopWindowsIcon />
          <div className={styles.header_left_text}>Your Workspace</div>
        </div>

        <div className={styles.editor_header_right}>
          <ZoomInIcon />
          <ZoomOutIcon />
          <HelpIcon />
        </div>
      </div>

      <div className={styles.editor_textarea}>Text Area</div>
      <div className={styles.editor_searchbar}>
        <SearchBar />
      </div>
    </div>
  );
}
