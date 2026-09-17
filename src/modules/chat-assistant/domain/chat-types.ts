/**
 * AI Chat Assistant & Hội thoại Domain Types (M08).
 */

export type ChatChannel = "WEB_WIDGET" | "INTERNAL_DASHBOARD" | "ZALO"
export type ChatSenderType = "USER" | "ASSISTANT" | "SYSTEM"

export interface SuggestedFlowerCard {
  productId: string
  productCode: string
  productName: string
  sampleImageUrl?: string | undefined
  priceVnd: number
  category: string
  wrapStyle: string
  reason: string
}

export interface ChatMessageMetadata {
  suggestedFlowers?: SuggestedFlowerCard[] | undefined
  createdOrderId?: string | undefined
  orderCode?: string | undefined
  userIntent?: string | undefined
  targetRoute?: string | undefined
  actionLabel?: string | undefined
  actionSteps?: string[] | undefined
}

export interface ChatMessage {
  id: string
  organizationId: string
  conversationId: string
  senderType: ChatSenderType
  content: string
  metadata?: ChatMessageMetadata | undefined
  createdAt: string
}

export interface ChatConversation {
  id: string
  organizationId: string
  customerId?: string | undefined
  title: string
  channel: ChatChannel
  status: "ACTIVE" | "CLOSED"
  createdAt: string
  updatedAt: string
}
