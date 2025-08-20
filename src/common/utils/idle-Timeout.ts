export function createIdleTimeout(
  onTimeout: () => void,
  timeoutMs = 30_000
): { reset: () => void; clear: () => void } {
  let idleTimer: NodeJS.Timeout;

  const reset = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(onTimeout, timeoutMs);
  };

  const clear = () => {
    if (idleTimer) clearTimeout(idleTimer);
  };

  return { reset, clear };
}
