/** Last-write-wins determinístico sobre strings ISO (UTC). Empate → row_version maior; depois servidor. */
export function isLocalNewer(localUpdatedAt: string, localRowVersion: number, remoteUpdatedAt: string, remoteRowVersion: number): boolean {
  if (localUpdatedAt !== remoteUpdatedAt) return localUpdatedAt > remoteUpdatedAt
  return localRowVersion > remoteRowVersion
}

/** aplica linha puxada no espelho local se o servidor for mais novo */
export function shouldApplyPull(local: { updated_at: string; row_version: number } | null | undefined, remote: { updated_at: string; row_version: number }): boolean {
  if (!local) return true
  if (local.updated_at !== remote.updated_at) return remote.updated_at > local.updated_at
  return remote.row_version >= local.row_version
}
