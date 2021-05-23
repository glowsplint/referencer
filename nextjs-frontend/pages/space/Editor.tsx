import styles from "../../styles/Editor.module.css";
import Autocomplete from "@material-ui/lab/Autocomplete";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { grey } from "@material-ui/core/colors";
import lastVerse from "./text/endings";
import IconButton from "@material-ui/core/IconButton";

import DesktopWindowsIcon from "@material-ui/icons/DesktopWindows";
import HelpIcon from "@material-ui/icons/Help";
import SearchIcon from "@material-ui/icons/Search";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";

const books = Object.keys(lastVerse);

function SearchBar({
  handleInputChange,
  handleSubmit,
  searchQuery,
}: {
  handleInputChange: (
    _event: React.ChangeEvent<HTMLInputElement>,
    newValue: string
  ) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  searchQuery: string;
}) {
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

function TextArea({
  textName,
  textBody,
}: {
  textName: string;
  textBody: string[];
}) {
  return (
    <div className={styles.editor_textarea}>
      <Typography variant="h6">{textName}</Typography>
      <Typography align="justify">{textBody.join(" ")}</Typography>
    </div>
  );
}

export default function Editor({
  textHeaders,
  textBodies,
  handleInputChange,
  handleSubmit,
  searchQuery,
}: {
  textHeaders: string[];
  textBodies: string[][];
  handleInputChange: (
    _event: React.ChangeEvent<HTMLInputElement>,
    newValue: string
  ) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  searchQuery: string;
}) {
  return (
    <div className={styles.editor}>
      <div className={styles.editor_header}>
        <div className={styles.editor_header_left}>
          <DesktopWindowsIcon />
          <div className={styles.header_left_text}>
            <Typography variant="subtitle2">Your Workspace</Typography>
          </div>
        </div>

        <div className={styles.editor_header_right}>
          <IconButton size="small" onClick={() => {}}>
            <ZoomInIcon />
          </IconButton>
          <IconButton size="small" onClick={() => {}}>
            <ZoomOutIcon />
          </IconButton>
          <IconButton size="small" onClick={() => {}}>
            <HelpIcon />
          </IconButton>
        </div>
      </div>

      <div className={styles.editor_textareas}>
        {textHeaders.map((textHeader: string, index: number) => (
          <TextArea
            textName={textHeader}
            textBody={textBodies[index]}
            key={index}
          />
        ))}
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
