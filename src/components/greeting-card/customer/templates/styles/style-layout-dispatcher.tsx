"use client"

import React from "react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import type { TemplateStyleConfig } from "./template-style-configs"
import {
  Layout01Editorial,
  Layout02Minimal,
  Layout03Cinematic,
  Layout04Romantic,
  Layout06Glass,
} from "./style-layouts-a"
import {
  Layout05Botanical,
  Layout07ShopPhoto,
  Layout08Daylight,
  Layout09InStore,
  Layout10Handheld,
  Layout11Lifestyle,
  Layout12MixedMedia,
} from "./style-layouts-b"

interface StyleLayoutDispatcherProps {
  product: GreetingCatalogProduct
  styleConfig: TemplateStyleConfig
  isActive: boolean
  isFavorite: boolean
  currentIndex: number
  totalCount: number
  onTapDetail?: (() => void) | undefined
  onToggleFavorite?: (() => void) | undefined
}

/**
 * Dispatches to the correct per-style layout component.
 * Each style has its own unique visual composition matching the spec.
 */
export function StyleLayoutDispatcher({
  product,
  styleConfig,
  isActive,
  isFavorite,
  currentIndex,
  totalCount,
  onTapDetail,
  onToggleFavorite,
}: StyleLayoutDispatcherProps) {
  const sharedProps = {
    product,
    isActive,
    isFavorite,
    currentIndex,
    totalCount,
    shopName: styleConfig.shopName,
    onTapDetail,
    onToggleFavorite,
  }

  switch (styleConfig.styleNumber) {
    case "01":
      return <Layout01Editorial {...sharedProps} />
    case "02":
      return <Layout02Minimal {...sharedProps} />
    case "03":
      return <Layout03Cinematic {...sharedProps} />
    case "04":
      return <Layout04Romantic {...sharedProps} />
    case "05":
      return <Layout05Botanical {...sharedProps} />
    case "06":
      return <Layout06Glass {...sharedProps} />
    case "07":
      return <Layout07ShopPhoto {...sharedProps} />
    case "08":
      return <Layout08Daylight {...sharedProps} />
    case "09":
      return <Layout09InStore {...sharedProps} />
    case "10":
      return <Layout10Handheld {...sharedProps} />
    case "11":
      return <Layout11Lifestyle {...sharedProps} />
    case "12":
      return <Layout12MixedMedia {...sharedProps} />
    default:
      return <Layout01Editorial {...sharedProps} />
  }
}
