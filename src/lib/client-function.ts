type ClientFunctionOptions = {
  method?: "GET" | "POST";
};

type ClientFunctionCall<TData> = [TData] extends [undefined]
  ? { data?: TData } | undefined
  : { data: TData };

type ClientFunctionMiddleware<TContext extends object = Record<string, unknown>> = (
  input?: unknown,
) => Promise<TContext> | TContext;

class ClientFunctionBuilder<TData = undefined, TContext extends object = Record<string, never>> {
  private validate: (input: unknown) => TData = (input) => input as TData;
  private middlewares: Array<() => Promise<object> | object> = [];

  validator<TNextData>(
    nextValidator: (input: unknown) => TNextData,
  ): ClientFunctionBuilder<TNextData, TContext> {
    const next = this as unknown as ClientFunctionBuilder<TNextData, TContext>;
    next.validate = nextValidator;
    return next;
  }

  middleware<TNextContext extends object>(
    nextMiddlewares: ClientFunctionMiddleware<TNextContext>[],
  ): ClientFunctionBuilder<TData, TContext & TNextContext> {
    this.middlewares = nextMiddlewares;
    return this as unknown as ClientFunctionBuilder<TData, TContext & TNextContext>;
  }

  handler<TResult>(
    nextHandler: (input: {
      data: TData;
      context: TContext;
    }) => TResult | Promise<TResult>,
  ): (call?: ClientFunctionCall<TData>) => Promise<Awaited<TResult>> {
    return async (call?: ClientFunctionCall<TData>): Promise<Awaited<TResult>> => {
      const data = this.validate(call?.data);
      let context: Record<string, unknown> = {};

      for (const middleware of this.middlewares) {
        context = { ...context, ...(await middleware()) };
      }

      return (await nextHandler({ data, context: context as TContext })) as Awaited<TResult>;
    };
  }
}

/**
 * Small client-side replacement for TanStack Start server functions.
 *
 * It preserves the existing call shape (`fn({ data })`) while executing
 * authenticated Supabase work in the browser under the current user's RLS
 * policies. Private workflows use `createEdgeFn` instead.
 */
export function createClientFn(_options: ClientFunctionOptions = {}) {
  return new ClientFunctionBuilder();
}

export function useClientFn<TFunction extends (...args: any[]) => any>(
  clientFunction: TFunction,
): TFunction {
  return clientFunction;
}
