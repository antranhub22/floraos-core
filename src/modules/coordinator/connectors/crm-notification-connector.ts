/**
 * CRM & Notification Connector.
 * Cổng cập nhật điểm khách hàng M09 và gửi thông báo Zalo ZNS / Kênh tích hợp.
 */

export interface ICrmNotificationConnector {
  syncOrderCompletion(params: {
    organizationId: string
    customerId?: string | null
    orderTotalVnd: number
    deliveredAt: Date
  }): Promise<boolean>

  notifyCustomerPOD(params: {
    organizationId: string
    recipientPhone: string
    podImageUrl?: string | null
    message: string
  }): Promise<boolean>
}

export class DirectCrmNotificationConnector implements ICrmNotificationConnector {
  async syncOrderCompletion(_params: {
    organizationId: string
    customerId?: string | null
    orderTotalVnd: number
    deliveredAt: Date
  }): Promise<boolean> {
    return true
  }

  async notifyCustomerPOD(_params: {
    organizationId: string
    recipientPhone: string
    podImageUrl?: string | null
    message: string
  }): Promise<boolean> {
    return true
  }
}
