/**
 * orders.ts — English dictionary section `orders` (mirrors vi/orders.ts)
 */

export const ordersEn = {
  header: {
    category: "Sales & Order Operations",
    title: "Orders",
    createOrder: "New Order",
    createFromChat: "Create from Chat",
    refresh: "Refresh",
    home: "Home",
    exportExcel: "Export Excel",
  },
  tabs: {
    allOrders: "All Orders",
    brochureLinks: "Order Links",
    paymentApproval: "Payment Review",
  },
  guidance: {
    badge: "ORDER PROCESSING GUIDE",
    title: "Florist Crafting & Delivery Process",
    description: "Each order includes a florist crafting ticket and a delivery slip with QR confirmation.",
    tips: {
      recipe: "Crafting ticket lists exact stem counts, wraps, and color tones",
      qcPhoto: "Take product photo for customer approval before dispatch",
      deliverySlip: "Print A6 delivery slip with greeting card and recipient details",
    },
  },
  filters: {
    searchPlaceholder: "Search by order code, recipient, or phone…",
    totalCount: "{count} orders",
    mobile: {
      all: "All",
      new: "New",
      arranging: "Arranging",
      delivering: "Out for Delivery",
      completed: "Delivered",
    },
  },
  columns: {
    newOrders: "New Orders",
    inProduction: "Arranging",
    outForDelivery: "Out for Delivery",
    delivered: "Delivered",
  },
  card: {
    code: "Order: {code}",
    deadline: "Due: {time}",
    recipient: "Recipient: {name}",
    phone: "Phone: {phone}",
    address: "Address: {address}",
    printTicket: "Print Florist Ticket",
    printSlip: "Print Delivery Slip",
  },
  modal: {
    createTitle: "Create New Order",
    detailsTitle: "Order Details",
    customerInfo: "Customer & Recipient Details",
    productInfo: "Product & Stem Formula",
    deliveryInfo: "Delivery Schedule & Address",
    notes: "Internal Notes for Florist",
  },
} as const
