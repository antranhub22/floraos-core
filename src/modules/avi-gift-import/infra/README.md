# Infra của module nạp AVI GIFT

Trống ở P8. Lượt nạp gọi thẳng `ProductRepository` của module `products` và
các repository của module `organization` (`UserRepository`,
`OrganizationRepository`, `WorkspaceRepository`, `RoleRepository`,
`MembershipRepository`) — không có bảng riêng nào của module này, nên không
có repository riêng nào để đặt ở đây.
