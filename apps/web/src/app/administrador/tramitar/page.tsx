"use client";

import { Suspense } from "react";
import { AdminShell } from "@/components/AdminShell";
import TramitarClient from "./tramitar-client";

export default function TramitarPage() {
  return (
    <Suspense
      fallback={
        <AdminShell>
          <p className="admin-empty">Cargando tramitacion...</p>
        </AdminShell>
      }
    >
      <TramitarClient />
    </Suspense>
  );
}
