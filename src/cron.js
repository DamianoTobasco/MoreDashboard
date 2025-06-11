// cron.js
import { createClient } from "@supabase/supabase-js";
import Moralis from "moralis";

// ────────────────────────────────────────────────────────────
// ENV / CONSTANTS
// ────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://xnskindbzrwyfphpweii.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuc2tpbmRienJ3eWZwaHB3ZWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MTg1NjcsImV4cCI6MjA2MDk5NDU2N30.kkRjkJjNCvrZ1cDCKqoLYognETQRrEatLwoMNo4ClJk";

const MORALIS_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjVlZjI4YjkxLTBiYjktNDJlOS1iMWZlLWJmMzE2YWZhMDk0NSIsIm9yZ0lkIjoiNDQ0NjM2IiwidXNlcklkIjoiNDU3NDc2IiwidHlwZUlkIjoiMWFiNzQ5MTEtYzY3YS00NzYwLTk2YTktZjFmY2FjZTUwMjM5IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDYwMjEzMzUsImV4cCI6NDkwMTc4MTMzNX0.EXOLzghiQHyCkP2dJyLHsnuenYRGRlu_pyVeWDBpUPw";

const TOKEN_ADDRESS = "0x88dF7BEdc5969371A2C9A74690cBB3668061E1E9";

// ────────────────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────────────────
async function initMoralis() {
  try {
    await Moralis.start({ apiKey: MORALIS_API_KEY });
  } catch (err) {
    console.error("Moralis already initialised or failed to start:", err.message);
  }
}

// ────────────────────────────────────────────────────────────
// DATA HELPERS
// ────────────────────────────────────────────────────────────
async function getHoldersCount() {
  try {
    const res = await fetch(
      `https://deep-index.moralis.io/api/v2.2/erc20/${TOKEN_ADDRESS}/holders?chain=pulse`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": MORALIS_API_KEY,
        },
      }
    );

    if (!res.ok) throw new Error(`Bad response (${res.status})`);

    const json = await res.json();
    return Number(json.totalHolders) || 0;
  } catch (err) {
    console.error("Error fetching holders count:", err.message);
    return 0;
  }
}

async function getTokenLiquidity() {
  try {
    const res = await fetch(
      `https://deep-index.moralis.io/api/v2.2/erc20/${TOKEN_ADDRESS}/pairs?chain=pulse&limit=1`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": MORALIS_API_KEY,
        },
      }
    );

    if (!res.ok) throw new Error(`Bad response (${res.status})`);

    const json = await res.json();
    const usd = json?.pairs?.[0]?.liquidity_usd;
    return Number.parseFloat(usd) || 0;
  } catch (err) {
    console.error("Error fetching token liquidity:", err.message);
    return 0;
  }
}

async function getMarketCap() {
  try {
    const res = await Moralis.EvmApi.token.getTokenMetadata({
      chain: 369, // PulseChain
      addresses: [TOKEN_ADDRESS],
    });

    const cap = res?.raw?.[0]?.market_cap;
    return Number.parseFloat(cap) || 0;
  } catch (err) {
    console.error("Error fetching market cap:", err.message);
    return 0;
  }
}

// ────────────────────────────────────────────────────────────
// MAIN INSERT / TRIM LOGIC
// ────────────────────────────────────────────────────────────
async function insertAndTrim() {
  await initMoralis();
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // pull metrics in parallel for speed
  const [holders, liquidity, marketcap] = await Promise.all([
    getHoldersCount(),
    getTokenLiquidity(),
    getMarketCap(),
  ]);

  const row = {
    holders,
    liquidity: liquidity.toFixed(2),
    marketcap: marketcap.toFixed(2),
    date: new Date().toISOString(),
  };

  const { error: insertErr } = await supabase
    .from("chart_data")
    .insert([row]);

  if (insertErr) {
    console.error("Error inserting data:", insertErr.message);
    return;
  }

  // keep only latest 7 rows
  const { data: rows, error: fetchErr } = await supabase
    .from("chart_data")
    .select("id")
    .order("date", { ascending: true });

  if (fetchErr) {
    console.error("Error fetching rows:", fetchErr.message);
    return;
  }

  if (rows.length > 7) {
    const idsToDelete = rows.slice(0, rows.length - 7).map((r) => r.id);
    const { error: deleteErr } = await supabase
      .from("chart_data")
      .delete()
      .in("id", idsToDelete);

    if (deleteErr) console.error("Error deleting old rows:", deleteErr.message);
  }
}

// ────────────────────────────────────────────────────────────
// EXECUTE
// ────────────────────────────────────────────────────────────
insertAndTrim()
  .then(() => {
    console.log("Cron job completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Unhandled error in cron job:", err);
    process.exit(1);
  });
