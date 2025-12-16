import { handleRedirectRequest, resolveConfigUrlFromBindings, type HandlerOptions } from "@/lib/handler";

declare const Deno:
  | undefined
  | {
      env?: {
        get?(key: string): string | undefined;
        toObject?(): Record<string, string>;
      };
      serve?: {
        (
          options: { port?: number },
          handler: (request: Request) => Response | Promise<Response>
        ): { finished: Promise<unknown> };
        (
          handler: (request: Request) => Response | Promise<Response>
        ): { finished: Promise<unknown> };
      };
    };

function resolveConfigUrl(): string | undefined {
  if (typeof Deno === "undefined") {
    return undefined;
  }

  try {
    const envObject = typeof Deno.env?.toObject === "function" ? Deno.env.toObject() : undefined;
    if (envObject && typeof envObject === "object") {
      return resolveConfigUrlFromBindings(envObject);
    }
  } catch {
  }

  return undefined;
}

const sharedOptions: HandlerOptions = {};
const resolvedConfigUrl = resolveConfigUrl();
if (resolvedConfigUrl) {
  sharedOptions.configUrl = resolvedConfigUrl;
}

const handler = (request: Request) => handleRedirectRequest(request, sharedOptions);

const serveImpl = typeof Deno?.serve === "function" ? Deno.serve.bind(Deno) : undefined;
if (!serveImpl) {
  throw new Error("Deno.serve is not available in this runtime");
}

const portRaw = typeof Deno?.env?.get === "function" ? Deno.env.get("PORT") : undefined;
const parsedPort = portRaw ? Number(portRaw) : undefined;
const server =
  parsedPort && Number.isFinite(parsedPort)
    ? serveImpl({ port: parsedPort }, handler)
    : serveImpl(handler);

if (parsedPort && Number.isFinite(parsedPort)) {
  console.log(`Deno server running at http://localhost:${parsedPort}`);
} else {
  console.log("Deno server running (platform-managed port)");
}

try {
  await server.finished;
} catch (error) {
  console.error("Deno server error", error);
}
