import { AptosClient, AptosAccount, HexString, TxnBuilderTypes, BCS } from "aptos";
import dotenv from "dotenv";
dotenv.config();

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);

const PRIVATE_KEY = process.env.APTOS_PRIVATE_KEY!;
const ACCOUNT_ADDRESS = process.env.APTOS_ACCOUNT_ADDRESS!;

// Create account from private key with proper error handling
let account: AptosAccount | null = null;

try {
  if (!PRIVATE_KEY || !ACCOUNT_ADDRESS) {
    console.warn("⚠️ [APTOS] Missing APTOS_PRIVATE_KEY or APTOS_ACCOUNT_ADDRESS environment variables");
  } else {
    // Ensure private key is in correct format (64 characters hex string)
    const cleanPrivateKey = PRIVATE_KEY.replace(/^0x/, ''); // Remove 0x prefix if present
    
    if (cleanPrivateKey.length !== 64) {
      console.warn(`⚠️ [APTOS] Invalid private key length: ${cleanPrivateKey.length}. Expected 64 characters.`);
    } else {
      const privateKeyBytes = new Uint8Array(Buffer.from(cleanPrivateKey, "hex"));
      account = new AptosAccount(privateKeyBytes);
      console.log("✅ [APTOS] Aptos account initialized successfully");
    }
  }
} catch (error) {
  console.error("❌ [APTOS] Failed to initialize Aptos account:", error);
  account = null;
}

export async function logBookingOnChain({
  jobId,
  user,
  worker,
  timestamp,
}: {
  jobId: number;
  user: string;
  worker: string;
  timestamp: number;
}) {
  // Check if account is properly initialized
  if (!account) {
    console.warn("⚠️ [APTOS] Cannot log booking - Aptos account not initialized");
    return null;
  }

  const payload = {
    type: "entry_function_payload",
    function: `${ACCOUNT_ADDRESS}::booking::add_booking`,
    type_arguments: [],
    arguments: [jobId, user, worker, timestamp],
  };

  try {
    console.log("🔗 [APTOS] Attempting to log booking on blockchain...");
    const txnRequest = await client.generateTransaction(account.address(), payload);
    const signedTxn = await client.signTransaction(account, txnRequest);
    const txResult = await client.submitTransaction(signedTxn);
    await client.waitForTransaction(txResult.hash);

    console.log("✅ [APTOS] Booking successfully logged on blockchain");
    return txResult.hash;
  } catch (err) {
    console.error("❌ [APTOS] Blockchain log failed:", err);
    return null;
  }
}
