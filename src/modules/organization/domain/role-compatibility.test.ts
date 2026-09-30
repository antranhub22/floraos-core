import { describe, expect, it } from "vitest"
import {
  isFlowerNetworkScope,
  isStoreScope,
  toCanonicalRoleUxGroup,
  toCanonicalRoleUxKey,
} from "./role-compatibility"

describe("role-compatibility bridge", () => {
  it("ánh xạ chính xác các nhóm cũ và mới về canonical RoleUxGroup", () => {
    expect(toCanonicalRoleUxGroup("ONE_STORE")).toBe("STORE")
    expect(toCanonicalRoleUxGroup("SINGLE")).toBe("STORE")
    expect(toCanonicalRoleUxGroup("STORE")).toBe("STORE")
    expect(toCanonicalRoleUxGroup("CHAIN")).toBe("FLOWER_NETWORK")
    expect(toCanonicalRoleUxGroup("FLOWER_NETWORK")).toBe("FLOWER_NETWORK")
    expect(toCanonicalRoleUxGroup("PLATFORM")).toBe("PLATFORM")
    expect(toCanonicalRoleUxGroup(null)).toBe("STORE")
  })

  it("ánh xạ chính xác role key cũ store_manager về store_admin", () => {
    expect(toCanonicalRoleUxKey("store_manager")).toBe("store_admin")
    expect(toCanonicalRoleUxKey("store_admin")).toBe("store_admin")
    expect(toCanonicalRoleUxKey("flower_network_admin")).toBe("flower_network_admin")
    expect(toCanonicalRoleUxKey("platform_admin")).toBe("platform_admin")
    expect(toCanonicalRoleUxKey("sales")).toBe("sales")
  })

  it("nhận diện đúng phạm vi điện hoa và cửa hàng", () => {
    expect(isFlowerNetworkScope("CHAIN")).toBe(true)
    expect(isFlowerNetworkScope("FLOWER_NETWORK")).toBe(true)
    expect(isFlowerNetworkScope("SINGLE")).toBe(false)
    expect(isFlowerNetworkScope("STORE")).toBe(false)

    expect(isStoreScope("SINGLE")).toBe(true)
    expect(isStoreScope("STORE")).toBe(true)
    expect(isStoreScope("ONE_STORE")).toBe(true)
    expect(isStoreScope("CHAIN")).toBe(false)
  })
})
