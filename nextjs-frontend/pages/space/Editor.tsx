import styles from "../../styles/Editor.module.css";
import Autocomplete from "@material-ui/lab/Autocomplete";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import { lastVerse } from "./text/endings";
import { grey } from "@material-ui/core/colors";

import DesktopWindowsIcon from "@material-ui/icons/DesktopWindows";
import HelpIcon from "@material-ui/icons/Help";
import SearchIcon from "@material-ui/icons/Search";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";

const books = Object.keys(lastVerse);

function SearchBar({ handleInputChange, handleSubmit, searchQuery }) {
  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <Autocomplete
        id="autocomplete"
        freeSolo
        fullWidth
        options={books}
        inputValue={searchQuery}
        onInputChange={handleInputChange}
        renderInput={(params) => (
          <TextField
            {...params}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: grey[500] }} />
                </InputAdornment>
              ),
            }}
            label="Search"
            size="small"
            margin="none"
            variant="outlined"
          />
        )}
      />
    </form>
  );
}

function TextArea({ textName, textBody }) {
  return (
    <div className={styles.editor_textarea}>
      {textName} | {textBody}{" "}
    </div>
  );
}

export default function Editor({
  textHeaders,
  textBodies,
  handleInputChange,
  handleSubmit,
  searchQuery,
}) {
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

      <div className={styles.editor_textareas}>
        <TextArea textName={textHeaders[0]} textBody={textBodies[0]} />
        <TextArea textName={textHeaders[1]} textBody={textBodies[1]} />
      </div>

      <div className={styles.editor_search}>
        <SearchBar
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
