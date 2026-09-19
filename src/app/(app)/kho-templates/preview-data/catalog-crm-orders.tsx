// Dữ liệu mẫu cho popup xem trước — nhóm Catalog (M02/M03), CRM (M08),
// Orders (M09). Chỉ để minh hoạ giao diện, KHÔNG phải dữ liệu thật.
import React from "react"
import { CatalogGuidanceCard } from "@/components/templates/catalog/catalog-guidance-card"
import { ProductDetailCard } from "@/components/templates/catalog/product-detail-card"
import { QuoteSummaryCard, type CostBreakdownItem } from "@/components/templates/catalog/quote-summary-card"
import { CrmGuidanceCard } from "@/components/templates/crm/crm-guidance-card"
import { CustomerProfileCard } from "@/components/templates/crm/customer-profile-card"
import { EventReminderCard, type EventReminderItem } from "@/components/templates/crm/event-reminder-card"
import { OrderGuidanceCard } from "@/components/templates/orders/order-guidance-card"
import { FloristTicketCard, type FloristFlowerItem } from "@/components/templates/orders/florist-ticket-card"
import { DeliveryReceiptCard } from "@/components/templates/orders/delivery-receipt-card"

const QUOTE_ITEMS: CostBreakdownItem[] = [
  { name: "Hồng đỏ Ecuador", quantity: 15, unitCost: "12.000đ", total: "180.000đ" },
  { name: "Baby trắng", quantity: 5, unitCost: "20.000đ", total: "100.000đ" },
  { name: "Lá dương xỉ", quantity: 3, unitCost: "5.000đ", total: "15.000đ" },
]

const REMINDERS: EventReminderItem[] = [
  { id: "1", customerName: "Chị Lan Anh", eventTitle: "Kỷ niệm ngày cưới", eventDate: "22/09", daysRemaining: 2, suggestedBudget: "700.000 - 900.000đ", preferredStyle: "Tone đỏ - trắng cổ điển" },
  { id: "2", customerName: "Anh Minh Quân", eventTitle: "Sinh nhật vợ", eventDate: "25/09", daysRemaining: 5, suggestedBudget: "500.000đ", preferredStyle: "Tone pastel nhẹ nhàng" },
]

const FLORIST_ITEMS: FloristFlowerItem[] = [
  { flowerName: "Hồng đỏ Ecuador", quantity: 15, unit: "cành", color: "Đỏ" },
  { flowerName: "Baby trắng", quantity: 5, unit: "bó", color: "Trắng" },
]

export const catalogCrmOrdersPreviews: Record<string, React.ReactNode> = {
  "catalog-guidance-card.tsx": <CatalogGuidanceCard />,
  "product-detail-card.tsx": (
    <ProductDetailCard
      code="HOA-0142"
      name="Nồng Nàn Yêu Thương"
      imageUrl="/images/sample-flower.jpg"
      category="Bó hoa cầm tay"
      price="650.000đ"
      originalPrice="750.000đ"
      stemCount={20}
      occasions={["Kỷ niệm", "Valentine"]}
    />
  ),
  "quote-summary-card.tsx": (
    <QuoteSummaryCard
      productName="Nồng Nàn Yêu Thương"
      items={QUOTE_ITEMS}
      laborCost="80.000đ"
      wrappingCost="50.000đ"
      subtotal="425.000đ"
      suggestedPrice="650.000đ"
      marginPercent={35}
    />
  ),
  "crm-guidance-card.tsx": <CrmGuidanceCard />,
  "customer-profile-card.tsx": (
    <CustomerProfileCard
      name="Chị Lan Anh"
      phone="0909 xxx xxx"
      tier="gold"
      totalOrders={12}
      totalSpent="8.500.000đ"
      preferredColors={["Đỏ", "Trắng"]}
      preferredFlowers={["Hồng", "Baby"]}
      notes="Thích bó cầm tay hơn giỏ, dị ứng phấn hoa ly"
    />
  ),
  "event-reminder-card.tsx": <EventReminderCard reminders={REMINDERS} />,
  "order-guidance-card.tsx": <OrderGuidanceCard />,
  "florist-ticket-card.tsx": (
    <FloristTicketCard
      orderCode="DH-0231"
      productName="Nồng Nàn Yêu Thương"
      deadlineTime="14:30 hôm nay"
      floristName="Chị Hương"
      items={FLORIST_ITEMS}
      wrapStyle="Giấy kraft nâu, nơ lụa đỏ"
      notes="Khách yêu cầu không dùng hoa ly"
    />
  ),
  "delivery-receipt-card.tsx": (
    <DeliveryReceiptCard
      orderCode="DH-0231"
      recipientName="Chị Lan Anh"
      recipientPhone="0909 xxx xxx"
      deliveryAddress="123 Nguyễn Huệ, Q.1, TP.HCM"
      deliveryTime="18:00 hôm nay"
      cardMessage="Chúc mừng kỷ niệm ngày cưới của chúng ta, yêu em nhiều!"
      shippingFee="30.000đ"
      totalAmount="680.000đ"
    />
  ),
}
