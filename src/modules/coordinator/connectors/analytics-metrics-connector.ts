/**
 * Analytics & Metrics Connector.
 * Cổng bắn số liệu vận hành điều phối sang M11 (Số liệu & Học máy).
 */

export interface IAnalyticsMetricsConnector {
  recordSlaMetric(params: {
    organizationId: string
    orderId: string
    partnerId?: string | null
    isOntime: boolean
    varianceMinutes: number
    qcScore?: number | null
  }): Promise<boolean>
}

export class DirectAnalyticsMetricsConnector implements IAnalyticsMetricsConnector {
  async recordSlaMetric(_params: {
    organizationId: string
    orderId: string
    partnerId?: string | null
    isOntime: boolean
    varianceMinutes: number
    qcScore?: number | null
  }): Promise<boolean> {
    return true
  }
}
