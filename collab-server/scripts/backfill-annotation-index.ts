import { createClient } from "@supabase/supabase-js";
import * as Y from "yjs";
import { extractAnnotations } from "../src/extract-annotations";
import { base64ToUint8 } from "../src/persistence";

const BATCH_SIZE = 50;

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  let cursor: string | null = null;
  let totalIndexed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalProcessed = 0;

  while (true) {
    let query = supabase
      .from("yjs_document")
      .select("room_name, state")
      .order("room_name")
      .limit(BATCH_SIZE);

    if (cursor) {
      query = query.gt("room_name", cursor);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch batch:", error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      totalProcessed++;
      try {
        const state = base64ToUint8(row.state);
        const doc = new Y.Doc();
        Y.applyUpdate(doc, state);
        const rows = extractAnnotations(doc);
        doc.destroy();

        if (rows.length === 0) {
          totalSkipped++;
          continue;
        }

        const { error: rpcError } = await supabase.rpc("upsert_annotation_index", {
          p_document_id: row.room_name,
          p_rows: rows,
        });

        if (rpcError) {
          console.error(`RPC failed for ${row.room_name}: ${rpcError.message}`);
          totalFailed++;
        } else {
          totalIndexed += rows.length;
        }
      } catch (err) {
        console.error(`Failed for ${row.room_name}:`, err instanceof Error ? err.message : err);
        totalFailed++;
      }
    }

    cursor = data[data.length - 1].room_name;
    console.log(`[${totalProcessed}] Processed... ${totalIndexed} annotations indexed`);

    if (data.length < BATCH_SIZE) break;
  }

  console.log(
    `\nDone. Processed: ${totalProcessed}, Indexed: ${totalIndexed}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`,
  );
}

main();
