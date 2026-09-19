/**
 * Use-case: Convert Chat To Draft Order (1-chạm chốt đơn sang M10 từ gợi ý của bot).
 */

import { notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import { getProductMasterIndex } from "@/modules/products/use-cases/get-product-master-index"
import { createOrder } from "@/modules/orders/use-cases/create-order"
import { hasRealPrice, formatQuotePriceForChat } from "../domain/flower-consultant-rules"
import { ChatRepository } from "../infra/chat-repository"

export async function convertChatToDraftOrder(
  ctx: TenantContext,
  conversationId: string,
  productId: string,
  customerInfo?: {
    recipientName?: string | undefined
    phone?: string | undefined
    street?: string | undefined
    cardMessage?: string | undefined
  },
  repo: ChatRepository = new ChatRepository()
) {
  const conversation = await repo.getConversation(ctx, conversationId)
  if (!conversation) {
    throw notFound()
  }

  const product = await getProductMasterIndex(ctx, productId)
  if (!product) {
    throw notFound()
  }

  // Chưa có giá bán lẻ thật cấu hình cho sản phẩm này (đúng thiết kế theo quyết định 17/09,
  // nợ #87: hệ thống không lưu giá niêm yết tĩnh, Master Index trả `null` khi chưa có giá
  // qua `quotePrice()`). KHÔNG tự tạo đơn với giá 0đ; chặn lại và yêu cầu nhập giá tay,
  // giống hệt nguyên tắc "không bịa giá" đã áp dụng cho Thẻ chào A6.
  //
  // Đọc vào biến cục bộ TRƯỚC khi gác cổng — để `hasRealPrice` (vị từ kiểu `is number`)
  // thu hẹp đúng biến này, không phải biểu thức truy cập thuộc tính lặp lại.
  const priceVnd = product.pricing.quotePriceVnd
  if (!hasRealPrice(priceVnd)) {
    throw validationFailed({
      priceVnd: `Mẫu hoa "${product.name}" chưa có giá bán cấu hình. Vui lòng tạo đơn thủ công và nhập giá trước khi chốt.`,
    })
  }

  // Tạo đơn hàng nháp vào M10
  const order = await createOrder(ctx, {
    customerId: conversation.customerId,
    cardMessage: customerInfo?.cardMessage || `Chúc mừng kỷ niệm / sinh nhật!`,
    internalNote: `[Tạo tự động từ AI Chatbot] Mẫu: ${product.name}. Gói: ${product.bom.wrapStyle}`,
    deliveryAddress: {
      recipientName: customerInfo?.recipientName || "Khách đặt qua Chat",
      phone: customerInfo?.phone || "0900000000",
      street: customerInfo?.street || "Nhận tại cửa hàng",
    },
    items: [
      {
        productId: product.id,
        description: `${product.name} [${product.code}]`,
        quantity: 1,
        unitPriceVnd: priceVnd,
      },
    ],
  })

  // Thêm tin nhắn hệ thống ghi nhận đơn đã tạo
  await repo.addMessage(
    ctx,
    conversationId,
    "SYSTEM",
    `⚡ Đã khởi tạo thành công Đơn hàng nháp **#${order.code}** (${product.name} — ${formatQuotePriceForChat(priceVnd)}) vào hệ thống Vận hành M10.`,
    { createdOrderId: order.id, orderCode: order.code }
  )

  return { order }
}
