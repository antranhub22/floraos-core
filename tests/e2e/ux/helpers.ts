import { randomUUID } from "node:crypto"
import type { Page } from "@playwright/test"
import { Client } from "pg"

const dbUrl = process.env.DATABASE_URL || "postgresql://floraos:floraos@localhost:5432/floraos"

export async function createTestUserAndLogin(
  page: Page,
  options?: {
    roleKey?: string
    workspaceKind?: "EXPERIENCE" | "PRODUCTION"
  }
): Promise<{ email: string; orgId: string; userId: string }> {
  const email = `e2e-ux-${randomUUID().slice(0, 8)}@floraos.test`
  const password = "MatKhau-E2E-2026!"
  const orgName = `Tiệm E2E UX ${randomUUID().slice(0, 4)}`

  const res = await page.request.post("/api/v1/auth/signup", {
    data: { email, password, name: "E2E Tester", organization_name: orgName },
  })
  if (!res.ok()) {
    throw new Error(`Signup failed: ${res.status()} ${await res.text()}`)
  }
  const body = (await res.json()) as { organization_id: string; user_id: string }
  const orgId = body.organization_id
  const userId = body.user_id

  if (
    (options?.workspaceKind && options.workspaceKind !== "EXPERIENCE") ||
    (options?.roleKey && options.roleKey !== "dieu_hanh")
  ) {
    const client = new Client({ connectionString: dbUrl })
    await client.connect()
    try {
      if (options?.workspaceKind && options.workspaceKind !== "EXPERIENCE") {
        await client.query("UPDATE workspaces SET kind = $1 WHERE organization_id = $2", [
          options.workspaceKind,
          orgId,
        ])
      }
      if (options?.roleKey && options.roleKey !== "dieu_hanh") {
        const roleRes = await client.query(
          "SELECT id FROM roles WHERE key = $1 AND (organization_id = $2 OR organization_id IS NULL) LIMIT 1",
          [options.roleKey, orgId]
        )
        if (roleRes.rows.length > 0) {
          const roleId = roleRes.rows[0].id
          await client.query(
            "UPDATE memberships SET role_id = $1 WHERE organization_id = $2 AND user_id = $3",
            [roleId, orgId, userId]
          )
        }
      }
    } finally {
      await client.end()
    }
  }

  return { email, orgId, userId }
}
