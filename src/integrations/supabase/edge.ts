import { supabase } from "@/integrations/supabase/client";

type EdgeEnvelope<T> = {
  data?: T;
  error?: string;
  requestId?: string;
};

export async function invokeEdgeFunction<TResponse>(
  functionName: string,
  action: string,
  input?: unknown,
): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke<EdgeEnvelope<TResponse>>(functionName, {
    body: { action, input: input ?? null },
  });

  if (error) {
    let message = error.message;
    const context = error.context as Response | undefined;
    if (context) {
      const payload = (await context.json().catch(() => null)) as EdgeEnvelope<never> | null;
      if (payload?.error) message = payload.error;
    }
    throw new Error(message);
  }

  if (!data || data.error) {
    throw new Error(data?.error ?? "The secure service returned an invalid response.");
  }

  return data.data as TResponse;
}

export function createEdgeFn<TInput, TResponse>(
  functionName: string,
  action: string,
  validate: (input: unknown) => TInput,
) {
  return async (call: { data: TInput }): Promise<TResponse> =>
    invokeEdgeFunction<TResponse>(functionName, action, validate(call.data));
}

export function createEdgeQuery<TResponse>(functionName: string, action: string) {
  return async (): Promise<TResponse> =>
    invokeEdgeFunction<TResponse>(functionName, action);
}

export async function createSignedDocumentUrl(
  bucket:
    | "avatars"
    | "client-documents"
    | "content-private"
    | "investor-kyc"
    | "payment-evidence",
  path: string,
  expiresIn = 60,
): Promise<string> {
  const result = await invokeEdgeFunction<{ signedUrl: string }>(
    "signed-document-url",
    "create",
    { bucket, path, expiresIn },
  );
  return result.signedUrl;
}
