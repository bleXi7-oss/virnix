import { createClient } from "../auth/supabase-server";

// Ensures the user's credit row exists (idempotent — creates 3-credit row for new users).
// Must be called before any balance read when the row may not exist yet.
export async function ensureUserCredits(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ensure_user_credits");
  if (error) throw new Error(`ensure_user_credits failed: ${error.message}`);
}

// Atomically deducts credits via the Supabase RPC.
// Returns the new balance on success, or -1 if credits were insufficient (race condition).
// The RPC checks balance >= amount and deducts in a single atomic UPDATE.
// Throws on database/network errors.
export async function deductCredits(amount: number): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("deduct_credits", { p_amount: amount });
  if (error) throw new Error(`deduct_credits failed: ${error.message}`);
  return data as number;
}
