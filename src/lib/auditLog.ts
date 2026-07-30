import { getDb } from '../platform/database/client'
import { adminAuditLogs } from '../platform/database/schema'

export async function writeAuditLog(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  meta?: Record<string, unknown>,
) {
  const db = getDb()
  await db.insert(adminAuditLogs).values({
    adminId,
    action,
    targetType: targetType ?? null,
    targetId: targetId ?? null,
    meta: meta ? JSON.stringify(meta) : '{}',
  })
}
