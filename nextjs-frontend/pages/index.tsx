import Head from "next/head";
import styles from "../styles/Home.module.css";
import TextField from "@material-ui/core/TextField";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Referencer</title>
        <meta name="description" content="Referencer" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <img src="logo.png" height={150} alt="Logo" />
        <form noValidate autoComplete="off">
          <TextField
            id="spaceID"
            label="Space ID"
            margin="dense"
            variant="outlined"
            size="small"
            autoFocus
            required
            fullWidth
          />
          <TextField
            id="password"
            label="Password"
            margin="dense"
            variant="outlined"
            size="small"
            type="password"
            required
            fullWidth
          />
        </form>
      </main>
    </div>
  );
}
