/**
 * Cổng đăng bài ra kênh ngoài (M07, thực thi ở SocialFlow).
 * Credential lấy theo tổ chức, không theo bảng tài khoản toàn cục.
 */
export interface PublishInput {
  organizationId: string;
  channel: string;
  assetIds: string[];
  caption?: string;
}

export interface PublisherProvider {
  readonly name: string;
  publish(input: PublishInput): Promise<{ externalId: string }>;
}
