import type { Prisma, PrismaClient } from "@/generated/prisma/client"

/**
 * Mọi repository nhận `DbClient` chứ không nhận `PrismaClient`, để cùng một
 * repository chạy được cả ngoài lẫn trong một giao dịch. Đồng thời hoá bằng
 * giao dịch cơ sở dữ liệu — không khoá ghi toàn cục (`YC-T9`).
 */
export type DbClient = PrismaClient | Prisma.TransactionClient
