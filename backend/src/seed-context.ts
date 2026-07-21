const logicalToUid = new Map<string, string>();

export function registerSeedUser(logicalId: string, uid: string): void {
  logicalToUid.set(logicalId, uid);
}

export function resolveSeedId(logicalId: string): string {
  return logicalToUid.get(logicalId) ?? logicalId;
}

export function clearSeedContext(): void {
  logicalToUid.clear();
}
