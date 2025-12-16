import { handleRedirectRequest } from "@/lib/handler";

export default {
  fetch(request: Request) {
    return handleRedirectRequest(request, {});
  },
};
