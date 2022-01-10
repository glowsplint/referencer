import { Button, TextField } from "@mui/material";
import React, { useState } from "react";

import CreateIcon from "@mui/icons-material/Create";
import FaceIcon from "@mui/icons-material/Face";
import Head from "next/head";
import Image from "next/image";
import InputIcon from "@mui/icons-material/Input";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import { LoginProvider } from "../contexts/Login";
import { imageLoader } from "../common/utils";
import styles from "../styles/Landing.module.css";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const [input, setInput] = useState<{
    displayName: string;
    codeInput: string;
  }>({
    displayName: "",
    codeInput: "",
  });
  const [displayNameError, _setDisplayNameError] = useState<boolean>(false);
  const [spaceIDError, _setSpaceIDError] = useState<boolean>(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setInput({ ...input, [name]: value });
  };

  const handleCreate = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    var ws: WebSocket = new WebSocket(
      encodeURI(
        `ws://${window.location.host}/ws/logon?username=${input.displayName}`
      )
    );
    ws.onmessage = function (ev) {
      const params = JSON.parse(ev.data);
      console.log(`Data received: ${params}`);
      router.push(`/space?r=${params.r}&u=${params.u}`);
    };
  };

  const handleJoin = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    var ws: WebSocket = new WebSocket(
      encodeURI(
        `ws://${window.location.host}/ws/logon?username=${input.displayName}&space_id=${input.codeInput}`
      )
    );
    ws.onmessage = function (ev) {
      const params = JSON.parse(ev.data);
      console.log(`Data received: r=${params.r}, u=${params.u}`);
      router.push(`/space?r=${params.r}&u=${params.u}`);
    };
  };

  return (
    <LoginProvider>
      <Head>
        <title>Referencer</title>
        <meta name="description" content="Referencer" />
        <link rel="icon" href="/public/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Image
          src="_"
          loader={() => imageLoader("/public/logo.png")}
          height="125"
          width="475"
          alt="Logo"
        />
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
      </main>
    </LoginProvider>
  );
}
