import { processTexts, useTexts } from "../contexts/Texts";

import Autocomplete from "@mui/material/Autocomplete";
import { DEVELOPMENT_MODE } from "../common/utils";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import books from "../common/books";
import { grey } from "@mui/material/colors";
import styles from "../styles/SearchBar.module.css";
import { useState } from "react";

const SearchBar = () => {
  const { setTexts } = useTexts();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getText = async (query: string) => {
    let url = "http://localhost:3000/api/";
    if (!DEVELOPMENT_MODE) {
      url = "http://localhost:5000/api/";
    }
    const response = await fetch(url + encodeURIComponent(query.trim()));
    const payload: {
      query: string;
      canonical: string;
      parsed: number[][];
      passage_meta: object[];
      passages: string[];
    } = await response.json();
    return payload;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchQuery !== "") {
      setSearchQuery("");
      const payload = await getText(searchQuery.toLowerCase());
      setTexts((previous) => {
        return {
          headers: [...previous.headers, payload.query + " ESV"],
          bodies: [...previous.bodies, processTexts(payload.passages[0])],
          isDisplayed: [...previous.isDisplayed, true],
        };
      });
    }
  };

  const handleInputChange = (
    _event: React.SyntheticEvent<Element, Event>,
    newValue: string
  ) => {
    setSearchQuery((previous) => newValue);
  };

  return (
    <div className={styles.searchBar}>
      <form className={styles.form} onSubmit={handleSubmit}>
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
    </div>
  );
};

export default SearchBar;
