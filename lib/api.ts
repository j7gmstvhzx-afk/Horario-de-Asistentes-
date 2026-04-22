import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiResult<T>> {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  error: string,
  status = 400,
): NextResponse<ApiResult<never>> {
  return NextResponse.json({ ok: false, error }, { status });
}

export function handleError(err: unknown): NextResponse<ApiResult<never>> {
  if (err instanceof ZodError) {
    const msg = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return fail(`Validación falló: ${msg}`, 422);
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHENTICATED") return fail("No autenticado", 401);
    if (err.message === "FORBIDDEN") return fail("Prohibido", 403);
    return fail(err.message, 500);
  }
  return fail("Error desconocido", 500);
}
