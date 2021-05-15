import styles from "./ButtonPane.module.css";
import Fab from "@material-ui/core/Fab";
import MenuIcon from "@material-ui/icons/Menu";
import InvertColorsIcon from "@material-ui/icons/InvertColors";
import PaletteIcon from "@material-ui/icons/Palette";

function ButtonIcon({ icon, callback }) {
  return (
    <div className={styles.leftpane_icon}>
      <Fab size="small" color="primary" aria-label="add" onClick={callback}>
        {icon}
      </Fab>
    </div>
  );
}

export default function ButtonPane({ menu, invertColors, palette }) {
  return (
    <div className={styles.leftpane}>
      <ButtonIcon icon={<MenuIcon />} callback={menu} />
      <ButtonIcon icon={<InvertColorsIcon />} callback={invertColors} />
      <ButtonIcon icon={<PaletteIcon />} callback={palette} />
    </div>
  );
}
