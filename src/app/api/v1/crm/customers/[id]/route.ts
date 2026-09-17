/**
 * GET|PATCH|DELETE /api/v1/crm/customers/[id]
 * Q1: Xem khách hàng
 * Q3: Sửa thông tin khách hàng
 * Q4: Xoá khách hàng (Hard Cap điều hành)
 */

import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getCustomerMasterIndex } from "@/modules/crm/use-cases/get-customer-master-index"
import { updateCustomer } from "@/modules/crm/use-cases/update-customer"
import { deleteCustomer } from "@/modules/crm/use-cases/delete-customer"

export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "Q1")

  const { id } = await context.params
  const customer = await getCustomerMasterIndex(ctx, id)
  return jsonResponse({ customer })
})

export const PATCH = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "Q3")

  const { id } = await context.params
  const body = await request.json()
  const customer = await updateCustomer(ctx, id, {
    name: body.name,
    phone: body.phone,
    email: body.email,
    address: body.address,
    notes: body.notes,
    tags: body.tags,
    preferredFlowers: body.preferredFlowers,
    preferredColors: body.preferredColors,
  })

  return jsonResponse({ customer })
})

export const DELETE = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "Q4")

  const { id } = await context.params
  await deleteCustomer(ctx, id)
  return jsonResponse({ success: true })
})
