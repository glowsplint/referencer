import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import styles from '../styles/Editor.module.css';

const PlateEditor = () => {
  const editor = usePlateEditor();

  return (
    <div className={styles.plateEditor}>
      <Plate editor={editor}>
        <PlateContent
          placeholder="Type your notes here..."
          style={{
            padding: '12px 16px',
            minHeight: '120px',
            outline: 'none',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
        />
      </Plate>
    </div>
  );
};

export default PlateEditor;
