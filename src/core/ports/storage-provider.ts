/**
 * Đường dẫn lưu trữ theo tổ chức, không theo người dùng:
 *
 *   org/<organization_id>/<product_id>/<asset_id>.<ext>
 *
 * Người dùng đổi vai, rời tổ chức hoặc bị xoá; quyền sở hữu dữ liệu
 * thuộc về tổ chức. Dùng user_id làm thành phần đường dẫn sẽ khiến ảnh của
 * một tổ chức nằm rải rác theo từng nhân viên và không áp được policy
 * truy cập ở cấp thư mục.
 */
/**
 * URL ký sẵn để TẢI LÊN và để TẢI VỀ là hai chữ ký khác nhau ở kho tương
 * thích S3. Bản đĩa cục bộ dùng chung một đường nên bỏ qua tham số này.
 */
export type StorageMethod = "GET" | "PUT";

export interface StorageProvider {
  readonly name: string;
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  signedUrl(
    key: string,
    expiresInSeconds: number,
    method?: StorageMethod
  ): Promise<string>;
}
