import { NextFunction, Request, Response } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!supabase) {
    return next();
  }

  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return next();
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return next();
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    req.userId = data.user.id;
    return next();
  } catch (err: any) {
    console.error("Auth verification error:", err?.message || err);
    return res.status(401).json({ error: "Authentication failed" });
  }
}
