import { describe, expect, it } from "vitest"
import { getJourneyCatalogUseCase } from "./get-journey-catalog"

describe("getJourneyCatalogUseCase", () => {
  it("trả về danh mục Store cho roleScope STORE và ONE_STORE", () => {
    const storeRes = getJourneyCatalogUseCase({ roleScope: "STORE" })
    expect(storeRes.length).toBe(13)
    expect(storeRes[0]?.roleScope).toBe("STORE")

    const oneStoreRes = getJourneyCatalogUseCase({ roleScope: "ONE_STORE" })
    expect(oneStoreRes.length).toBe(13)
  })

  it("trả về danh mục Platform cho roleScope PLATFORM", () => {
    const res = getJourneyCatalogUseCase({ roleScope: "PLATFORM" })
    expect(res.length).toBe(10)
    expect(res[0]?.roleScope).toBe("PLATFORM")
  })

  it("trả về danh mục Network cho roleScope FLOWER_NETWORK và CHAIN", () => {
    const networkRes = getJourneyCatalogUseCase({ roleScope: "FLOWER_NETWORK" })
    expect(networkRes.length).toBe(8)
    expect(networkRes[0]?.roleScope).toBe("FLOWER_NETWORK")

    const chainRes = getJourneyCatalogUseCase({ roleScope: "CHAIN" })
    expect(chainRes.length).toBe(8)
  })
})
