/**
 * Order Ingestion Connector.
 * Cổng nhận đơn từ các nguồn: M10 Orders, M08 AI Chat, M06 Catalog, hoặc nhập tay.
 */

export interface IngestOrderPayload {
  organizationId: string
  orderId: string
  source: "ORDER_M10" | "CHAT_M08" | "CATALOG_M06" | "MANUAL"
  coordinatorNote?: string
}

export interface IOrderIngestionConnector {
  ingest(payload: IngestOrderPayload): Promise<{ coordinationId: string; success: boolean }>
}

/**
 * Adapter mặc định nhận đơn trong cùng tiến trình (in-process).
 */
export class InProcessOrderIngestionConnector implements IOrderIngestionConnector {
  async ingest(payload: IngestOrderPayload): Promise<{ coordinationId: string; success: boolean }> {
    // Sẵn sàng nhận lời gọi từ M10 khi đơn chuyển sang CONFIRMED
    return {
      coordinationId: `coord-${payload.orderId}`,
      success: true,
    }
  }
}
