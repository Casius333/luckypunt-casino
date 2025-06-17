"use client";
import { useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ClientOnlySupabaseDebug() {
  useEffect(() => {
    const supabase = createClientComponentClient();
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("Supabase session:", data, error);
    });
  }, []);
  return null;
} 