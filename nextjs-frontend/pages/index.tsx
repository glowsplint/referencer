import React, { useState } from "react";
import Head from "next/head";
import styles from "./Landing.module.css";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Router from "next/router";

import KeyboardIcon from "@material-ui/icons/Keyboard";
import FaceIcon from "@material-ui/icons/Face";
import CreateIcon from "@material-ui/icons/Create";
import InputIcon from "@material-ui/icons/Input";
import { LoginProvider } from "../contexts/Login";

const InputField = ({
  name,
  label,
  margin,
  variant,
  size,
  prependIcon,
  handleChange,
  error,
  helperText,
  required = false,
  autoFocus = true,
}: {
  name: string;
  label: string;
  margin: "none" | "dense" | "normal";
  variant: "standard" | "filled" | "outlined";
  size: "small" | "medium";
  prependIcon: JSX.Element;
  handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  error: boolean;
  helperText: string;
  required?: boolean;
  autoFocus?: boolean;
}) => {
  return (
    <div className={styles.inputField}>
      <span className={styles.icon}>{prependIcon}</span>
      <TextField
        name={name}
        label={label}
        margin={margin}
        variant={variant}
        size={size}
        required={required}
        fullWidth
        autoFocus={autoFocus}
        onChange={handleChange}
        error={error}
        helperText={helperText}
      />
    </div>
  );
};

export default function Home() {
  const [input, setInput] = useState<object>({
    displayName: "",
    codeInput: "",
  });
  const [displayNameError, setDisplayNameError] = useState<boolean>(false);
  const [spaceIDError, setSpaceIDError] = useState<boolean>(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setInput({ ...input, [name]: value });
  };

  const handleCreate = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    Router.push("/space");
  };

  const handleJoin = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    Router.push("/space");
  };

  return (
    <div>
      <Head>
        <title>Referencer</title>
        <meta name="description" content="Referencer" />
        <link rel="icon" href="/public/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <img src="/public/logo.png" height="125" width="475" alt="Logo" />
        <LoginProvider>
          <form className={styles.form}>
            <span className={styles.row}>
              <InputField
                name="displayName"
                label="Display Name"
                margin="none"
                variant="outlined"
                size="small"
                prependIcon={<FaceIcon />}
                handleChange={handleInputChange}
                error={displayNameError}
                helperText={
                  displayNameError ? "You must provide a display name." : ""
                }
                autoFocus
                required
              />
              <span className={styles.button}>
                <Button
                  variant="contained"
                  size="medium"
                  color="secondary"
                  startIcon={<CreateIcon />}
                  onClick={handleCreate}
                >
                  Create
                </Button>
              </span>
            </span>
            <span className={styles.row}>
              <InputField
                name="spaceID"
                label="Enter a code or link"
                margin="none"
                variant="outlined"
                size="small"
                prependIcon={<KeyboardIcon />}
                handleChange={handleInputChange}
                error={spaceIDError}
                helperText={
                  spaceIDError ? "Please provide a valid code or link." : ""
                }
              />
              <span className={styles.button}>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<InputIcon />}
                  onClick={handleJoin}
                >
                  Join
                </Button>
              </span>
            </span>
          </form>
        </LoginProvider>
      </main>
    </div>
  );
}
