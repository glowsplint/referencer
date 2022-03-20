import Autocomplete from "@mui/material/Autocomplete";
import books from "../common/books";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import styles from "../styles/SearchBar.module.css";
import TextField from "@mui/material/TextField";
import { DEVELOPMENT_MODE } from "../common/constants";
import { grey } from "@mui/material/colors";
import { parseTexts, useTexts } from "../contexts/Texts";
import { useState } from "react";

const SearchBar = () => {
  const { texts, setTexts } = useTexts();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getText = async (query: string) => {
    let url = "http://localhost:3000/api/";
    if (!DEVELOPMENT_MODE) {
      url = "/api/";
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
      const { query, passages } = payload;

      // Guard clause against nullish error queries
      if (passages[0] === undefined) return;

      // Guard clause against too many passages
      if (texts.passages.length >= 10) return;

      setTexts((previous) => {
        return {
          passages: [
            ...previous.passages,
            {
              header: query + " ESV",
              body: parseTexts(passages[0]),
              isDisplayed: true,
            },
          ],
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
