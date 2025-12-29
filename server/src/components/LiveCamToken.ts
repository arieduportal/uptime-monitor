import { supabase, TOKEN_TABLE } from "../config/config.js";

export const validateLiveCamToken = async (token: string) => {
  if (!token || token.length < 10) return false;

  try {
    const { data, error } = await supabase
      .from(TOKEN_TABLE)
      .select("token, used")
      .eq("token", token)
      .single();

    if (error || !data) return false;

    if (data.used === true) {
      return false;
    }

    const { error: updateError } = await supabase
      .from(TOKEN_TABLE)
      .update({ used: true })
      .eq("token", token);

    if (updateError) return false;

    return true;

  } catch (err) {
    console.error("Validate LiveCam Token Error:", err);
    return false;
  }
};
