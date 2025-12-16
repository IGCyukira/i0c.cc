import { handleRedirectRequest, resolveConfigUrlFromBindings, type HandlerOptions } from "@/lib/handler";

declare const Deno:
  | undefined
  | {
      env?: {
        get?(key: string): string | undefined;
        toObject?(): Record<string, string>;
      };
      serve?(
        options: { port?: number },
        handler: (request: Request) => Response | Promise<Response>
      ): { finished: Promise<unknown> };
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

const port = Number((typeof Deno !== "undefined" && typeof Deno.env?.get === "function" && Deno.env.get("PORT")) ?? 8000);

if (typeof Deno?.serve !== "function") {
  throw new Error("Deno.serve is not available in this runtime");
}

console.log(`Deno server running at http://localhost:${port}`);

const server = Deno.serve({ port }, (request) => handleRedirectRequest(request, sharedOptions));
