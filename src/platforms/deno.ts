// @ts-expect-error Deno requires explicit ".ts" extension; suppressed for Node typecheck.
import { handleRedirectRequest, resolveConfigUrlFromBindings, type HandlerOptions } from "../lib/handler.ts";

export function createDenoHandler(options?: HandlerOptions) {
  const configUrl = options?.configUrl ?? resolveConfigUrlFromBindings();
  const baseOptions = configUrl && configUrl !== options?.configUrl ? { ...options, configUrl } : options;

  return (request: Request): Promise<Response> => handleRedirectRequest(request, baseOptions);
}

export const handler = createDenoHandler();

export type { HandlerOptions };
