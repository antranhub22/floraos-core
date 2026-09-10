#!/usr/bin/env bash
#
# Dựng cơ sở dữ liệu RIÊNG cho `npm run test:tenant` — trả nợ #46.
#
# Bộ test cách ly `TRUNCATE` 22 bảng trước mỗi ca thử. Việc đó đúng (bộ test
# phải bắt đầu từ CSDL rỗng), nhưng trước ngày 09/10 nó chạy trên CHÍNH
# database phát triển, nên mỗi lần chạy cổng bắt buộc là mất sạch dữ liệu
# AVI GIFT. Đã mất thật hai lần trong một tối.
#
# Chạy một lần sau `docker compose up -d`, rồi quên nó đi.
set -euo pipefail

URL_TEST="${DATABASE_URL_TEST:-postgresql://floraos:floraos@localhost:5432/floraos_test}"

# Cắt query string rồi lấy phần sau dấu "/" cuối — tên database.
KHONG_QUERY="${URL_TEST%%\?*}"
TEN_DB="${KHONG_QUERY##*/}"

case "$TEN_DB" in
  *_test) ;;
  *)
    echo "Tên database phải kết thúc bằng _test, đang là: $TEN_DB" >&2
    echo "Đó là chốt chặn của tests/helpers/database.ts — đừng lách nó." >&2
    exit 1
    ;;
esac

if docker compose exec -T db psql -U floraos -d postgres -tAc \
     "SELECT 1 FROM pg_database WHERE datname='$TEN_DB'" | grep -q 1; then
  echo "Database $TEN_DB đã có."
else
  docker compose exec -T db psql -U floraos -d postgres -c "CREATE DATABASE \"$TEN_DB\""
  echo "Đã tạo database $TEN_DB."
fi

# Đẩy lược đồ. `--accept-data-loss` an toàn ở ĐÂY và chỉ ở đây: database này
# tồn tại để bị xoá sạch trước mỗi ca thử, không giữ dữ liệu của ai.
DATABASE_URL="$URL_TEST" npx prisma db push --skip-generate --accept-data-loss

echo ""
echo "Xong. npm run test:tenant từ giờ chạy trên $TEN_DB, không đụng dữ liệu phát triển."
