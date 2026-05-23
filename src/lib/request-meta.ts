export function createRequestId() {
  return crypto.randomUUID();
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function getRequestMeta(request: Request, requestId: string) {
  return {
    requestId,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}
