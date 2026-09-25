/**
 * Creative Studio Connector.
 * Cổng kết nối với Creative Studio M04/M07 (sinh ảnh biến thể, thiệp cá nhân hóa).
 */

export interface ICreativeStudioConnector {
  requestPackagingVisuals(params: {
    organizationId: string
    orderId: string
    recipeName: string
    cardMessage?: string | null
  }): Promise<{ status: "QUEUED" | "READY"; previewUrl?: string }>
}

export class DirectCreativeStudioConnector implements ICreativeStudioConnector {
  async requestPackagingVisuals(_params: {
    organizationId: string
    orderId: string
    recipeName: string
    cardMessage?: string | null
  }): Promise<{ status: "QUEUED" | "READY"; previewUrl?: string }> {
    return { status: "READY" }
  }
}
