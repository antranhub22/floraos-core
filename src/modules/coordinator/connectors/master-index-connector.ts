/**
 * Master Index Connector.
 * Cổng kết nối và nạp Product Master Index & Customer Master Index SSOT.
 */

import type { ProductMasterIndex } from "@/modules/products/domain/product-master-index"
import type { CustomerMasterIndex } from "@/modules/crm/domain/customer-master-index"

export interface IMasterIndexConnector {
  getProductRecipe(productId: string, organizationId: string): Promise<ProductMasterIndex | null>
  getCustomerProfile(customerId: string, organizationId: string): Promise<CustomerMasterIndex | null>
}

export class DirectMasterIndexConnector implements IMasterIndexConnector {
  async getProductRecipe(_productId: string, _organizationId: string): Promise<ProductMasterIndex | null> {
    // Kết nối tới ProductMasterIndexRepository khi cần
    return null
  }

  async getCustomerProfile(_customerId: string, _organizationId: string): Promise<CustomerMasterIndex | null> {
    // Kết nối tới CustomerMasterIndex khi cần
    return null
  }
}
