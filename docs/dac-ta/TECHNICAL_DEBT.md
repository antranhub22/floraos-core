# Nợ kỹ thuật

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 2 | `bom.wrapping` chưa có trường `quantity`, nhưng quy ước đếm yêu cầu đếm số lớp giấy gói | Hợp đồng Vision chỉ được thêm trường; việc thêm thuộc phạm vi M01 | P5 |
| 3 | Không có bộ chọn chi nhánh trên giao diện | Bản đầu phục vụ một cửa hàng; RBAC vẫn đỡ sẵn phạm vi chi nhánh | Khi có tổ chức Chuỗi thật |
| 4 | `LocalBudd` ở Prisma 5, core ở Prisma 7 | Nâng `LocalBudd` giữa lúc M05/M06 đang chạy là xáo trộn không cần thiết | P7 |
| 5 | Hạn mức tính bằng truy vấn tổng hợp trên `usage` mỗi lần tạo job | Đơn giản và đúng; chỉ thành vấn đề khi bảng lớn | Khi một tổ chức vượt vài trăm nghìn dòng usage |
| 6 | `ORG_docx` của `LocalBudd` vẫn mô tả năm bảng sẽ chuyển sang core | Sửa cả 12 tệp giữa lúc M05/M06 đang chạy là xáo trộn; đã dán một trang cảnh báo ở đầu | P7 |
| 7 | Vai hệ thống không có ràng buộc duy nhất ở tầng cơ sở dữ liệu | `@@unique([organization_id, key])` không chặn được trùng khi `organization_id` là NULL — Postgres coi mọi NULL là phân biệt, và Prisma 7 chưa khai được `NULLS NOT DISTINCT`. Hiện chặn bằng khoá tư vấn trong `ensureSystemRoles`, có test khoá | Khi Prisma khai được chỉ mục duy nhất riêng phần, hoặc khi vai hệ thống chuyển thành hằng trong mã ở P2 |
| 8 | Bốn bảng thuộc tenant chưa có khoá ngoại về `organizations` | Lược đồ ở đặc tả 07 mục 3 khai `organization_id` là cột thường; bộ gác và bộ test cách ly đang giữ tính đúng đắn | Cùng đợt với P3, khi số bảng thuộc tenant tăng gấp đôi |
| 9 | Người mở tổ chức nhận vai `dieu_hanh`, không phải `experience_user` | Vai `experience_user` chỉ có `K1` và `K2` nên người vừa đăng ký sẽ không đọc nổi tổ chức của chính mình. Đây là một dòng hằng ở `domain/system-roles.ts` | P10, khi Experience Mode chốt ai nhận vai nào |
| 10 | Chưa giới hạn tần suất trên endpoint đăng nhập (`YC-S5`) | Cần một kho đếm dùng chung mà bản này chưa có | P12 |
| 11 | Vai riêng của tổ chức không bao giờ nhận được một năng lực có trần cứng, kể cả một vai "quản lý khu vực" có chủ đích tương đương Điều hành | Trần cứng (`hardCap`) đặt tên các khoá vai HỆ THỐNG cụ thể; vai tự đặt không khớp bất kỳ trần nào — lựa chọn an toàn theo mặc định, xem `permission-resolver.ts` | Khi có tổ chức Chuỗi thật cần một cấp quyền giữa Điều phối và Điều hành |
| ~~12~~ | **ĐÃ CHỐT 09/10 với anh Tony (AskUserQuestion):** mặc định của công tắc `cho_phep_tu_duyet` là `true` — giữ nguyên như mã hiện tại (`DEFAULT_ALLOW_SELF_APPROVAL = true`, `self-approval-policy.ts`), không đổi mã | Đặc tả 02 mục 2 nêu công tắc nhưng không nói giá trị mặc định; `true` khớp phát biểu "Điều hành là tập cha", nay đã là quyết định chốt, không còn là giả định | — Đã trả |
| 13 | `POST /members/invite` tạo `users` với `password_hash` rỗng nhưng chưa có luồng email hay màn nhận lời mời để người được mời tự đặt mật khẩu | Ngoài phạm vi P2 — P2 chỉ dựng bộ gác quyền, chưa dựng luồng thông báo. Người được mời hiện không đăng nhập được cho tới khi luồng này có | Trước khi tính năng mời thành viên dùng thật, không gắn với một pha cụ thể trong lộ trình P0–P12 |

| ~~14~~ | **ĐÃ CHỐT 09/10 với anh Tony (AskUserQuestion):** giữ `cost_credit` là hằng số trong mã (`src/modules/usage/domain/pricing.ts`) — chưa cần bảng cấu hình, chưa cần giá khác nhau theo tổ chức ở giai đoạn này | Chưa có quyết định kinh doanh về gói giá/mô hình định giá; đổi sang bảng cấu hình lúc này là xây trước khi có nhu cầu thật | Mở lại khi có quyết định kinh doanh về gói giá thật — không phải một ngày cụ thể trong lộ trình P0–P12 |
| 15 | `POST /assets/upload-url` dùng `LocalDiskStorageProvider` — ghi vào đĩa cục bộ của tiến trình web, ký URL bằng lại `SESSION_SECRET` qua HMAC | `.env.example` đã có ô `STORAGE_ENDPOINT`/`STORAGE_BUCKET`/`STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY` nhưng chưa có khoá thật lẫn adapter S3/R2 đọc chúng; cổng `StorageProvider` đã tách nên đổi adapter sau này không sửa module (kiến trúc V2 mục 3, đặc tả 05 mục 5) | Trước khi lên production thật — đĩa cục bộ không dùng được qua nhiều tiến trình/máy chủ, và không sống sót qua một lần triển khai lại |
| 16 | `job_events.seq` tính bằng đọc `MAX(seq)` rồi ghi `+1`, không khoá | An toàn trong vận hành bình thường vì một job chỉ có đúng một worker sở hữu sau `claimNext` (đặc tả 07 mục 6.1) — nhưng đây là một giả định, không phải một ràng buộc cơ sở dữ liệu chặn được | Nếu có ngày hai tiến trình cùng ghi log cho một job (ví dụ retry chồng lấn xử lý cũ chưa kịp dừng) |
| 17 | `GET /usage/summary` chưa chia theo chi nhánh cho tổ chức Chuỗi (đặc tả 06 mục 10 đòi, đặc tả 07 mục 7 không có cột `branch_id` trên `usage`) | `generation_jobs` có `branch_id` nhưng `usage` thì không — suy chi nhánh qua `usage.job_id → generation_jobs.branch_id` cần một JOIN mà đặc tả 07 không tính tới khi viết bảng `usage` | Khi có tổ chức Chuỗi thật cần xem mức dùng theo chi nhánh — quyết định thêm cột `branch_id` vào `usage` hay JOIN qua `generation_jobs` |
| 18 | *(gần như đã trả 09/09)* `npm run test:tenant` nay **35/35 xanh thật** trên Postgres, sau ba vòng tìm-sửa lỗi qua log thật của anh Tony (`pg_notify` qua `$queryRaw` ném `P2010`; 2 test sai giả định `credit_balance` mặc định 0, bỏ sót credit chào mừng `TRIAL_CREDIT_BALANCE`; 4 test chưa kiểm đúng đường CREDIT vì workspace mặc định luôn là `EXPERIENCE`) | `npm test` (domain thuần ngoài `tests/tenant/`: `asset-rules`/`job-rules`/`pricing`/`quota`/`storage-key`) vẫn chưa có một lần chạy thật xác nhận trong phiên này — chỉ `tsc --noEmit` | Anh Tony chạy `npm test` một lần, xác nhận xanh — khi đó dòng nợ này đóng hẳn, chuyển xuống mục "Đã trả" |
| 19 | Ngưỡng chạy lượt hai (`NGUONG_CHAY_LUOT_HAI=70`, `NGUONG_CHAY_LUOT_HAI_THANH_PHAN=60`) và ngưỡng đồng thuận đếm kế thừa (`NGUONG_LECH=0.25`) là lựa chọn triển khai của P5, chưa đo trên dữ liệu thật | Đã có bộ ảnh vàng đạt nghiệm thu (8 ảnh, 09/12) để đo — cần chạy đo | Khi có thời gian, đo lại độ chính xác theo ngưỡng và điều chỉnh |
| 20 | P5 mới nối kênh LLM (`OpenAIStructuredProvider`, 2 lượt, đồng thuận trung vị qua `chot()`) — CHƯA nối kênh diện tích cụm và kênh chặn trên vật lý (`chot_danh_sach` đầy đủ ba kênh, `count_engine.py`) vào pipeline thật | Đã có bộ ảnh vàng đạt nghiệm thu (8 ảnh, 09/12) — có thể nối và đo 3 kênh | Nối đủ ba kênh trước khi coi M01 hoàn chỉnh |
| 21 | `approve-analysis.ts`: khi `product_id` là null lúc duyệt thì tự tạo `products` mới với mã `AUTO-<8 ký tự ngẫu nhiên>` | Đặc tả 06/07 không nói rõ hành vi duyệt một phân tích chưa gắn sản phẩm nào — đây là một giả định để luồng chạy được, không phải quyết định sản phẩm đã chốt | Anh Tony xác nhận trước khi màn duyệt đi vào sản xuất |
| 22 | Sau khi `approval_state = APPROVED`, `PATCH /vision/analyses/:id` luôn trả 409 — không có luồng thu hồi duyệt/sửa lại | Suy từ nguyên tắc "kết quả không ghi thẳng Product Master, phải qua duyệt", nhưng đặc tả không nói rõ có cần un-approve hay không | Anh Tony xác nhận — có cần luồng thu hồi duyệt không, trước khi vướng thực tế vận hành |
| 23 | `_catalog_block()` trong `openai_structured.py` là khối trống/placeholder — chưa có bảng vật liệu (materials) riêng theo tổ chức để đưa vào prompt, dù `hidden_materials.json` đã copy nguyên từ v1 | Đặc tả 07 mục 9 không khai bảng materials theo tổ chức; v1 dùng Excel tĩnh dùng chung, core P5 chưa có tương đương theo tenant | Khi có yêu cầu vật liệu riêng theo từng cửa hàng/tổ chức |
| 24 | **ĐÃ TRẢ 09/12.** Bộ ảnh vàng: đã dựng KHUNG (100 ảnh) + 8 ảnh gán nhãn đủ trường (`labeled_by` Nguoi-A + `verified_by` Nguoi-B, 2026-09-12) → đạt nghiệm thu theo luật mới (chỉ cần 8 ảnh). Xem `golden/labels/g001.json`...`g014.json`, `golden/TRANG_THAI_GAN_NHAN.md`, `docs/dac-ta/Checklist_Thuc_Thi.md` P5. **Thêm 09/14:** `OpenAIStructuredProvider` gọi API OpenAI thật (`gpt-4o-mini`) trên 4 ảnh vàng (g001, g002, g010, g011) → kết quả chi tiết trong `golden/ai-proposals-openai/`, đối chiếu với nhãn người trong `golden/ai-accuracy-report-openai.csv`. Kết quả: damaged_count 4/4 đúng, bud_count 2/2 đúng khi có, flower_count AI ước tính nơi người không đếm được (occluded). Hạng `local_cv` được thay bằng `openai_direct` (nợ #61). |

| 24a | **Chưa trả.** `OpenAIStructuredProvider` gọi API OpenAI thật trên 8 ảnh vàng còn lại (g003-g014) để đối chiếu kết quả với nhãn người. Đã chạy 4/8 (g001, g002, g010, g011 → `golden/ai-proposals-openai/`). Ảnh g003-g007, g009 nằm trong `golden/images/` (NFD Unicode — cần chuẩn hoá NFC trước khi đọc). Chạy script `scripts/chay-openai-golden.py` và mở rộng danh sách, hoặc viết script riêng đọc đúng tên tệp Việt | Trả khi đủ 8 ảnh đối chiếu → chốt chính xác tuyệt đối cho provider Vision |
| 25 | `product_form` trong nhãn dựng tự động suy từ chữ cái đầu mã sản phẩm (B=bó, G=giỏ, K=lẵng) khi tên thư mục không có từ khoá tường minh; và "kệ" (kệ hoa đứng) tạm xếp chung nhóm "lẵng" vì mục 3 của `BO_ANH_VANG.md` chỉ liệt kê 5 dạng bó/giỏ/hộp/bình/lẵng, không có "kệ" | Suy từ quy ước đặt mã quan sát được (`BHC`, `GHKT`, `KHCB`…), chưa xác nhận với anh Tony đây có đúng là quy ước chính thức không | Anh Tony xác nhận quy ước mã, và xác nhận "kệ" nên tính là "lẵng" hay là một `product_form` riêng — sửa `PREFIX_LETTER_FORM`/`FORM_KEYWORDS` trong script nếu cần |

| 26 | Phạm vi M02 ở P6 chỉ dựng engine giá cốt lõi (`quotePrice`/`checkPriceInvariants`/`checkPriceGuard`) + `pricing_rules` CRUD — KHÔNG dựng luồng "thẻ chào giá" (nhóm năng lực `pricing_card`, C1–C28, đã có sẵn trong `capability-catalog.ts` từ harvest R2 nguyên vẹn: phụ phí, hạng đối tác, bắn đơn cho đối tác, chu kỳ thanh toán…). Cùng lý do, nguồn của `effectiveCostVnd` ("giá vốn hiệu lực", tham số đầu vào của `quotePrice`) chưa được quyết — `gia_von.py` (REUSE, 302 dòng, `FloraOS/python-service/analyzer/`) chưa xếp vào đợt harvest H1–H10 nào, và core chưa có bảng vật liệu theo tổ chức (cùng khoảng trống với nợ #23) | Xác nhận với chủ sản phẩm 09/10 (AskUserQuestion trong phiên P6): "chỉ engine giá cốt lõi", để `pricing_card` cho một pha sau — PRD/Checklist P6 cũng chỉ mô tả đúng ngần này, không nhắc thẻ/bắn đơn | Khi có quyết định xây luồng "thẻ chào giá" — lúc đó mới cần chốt luôn nguồn giá vốn (`gia_von.py` hay nhập tay) |
| 27 | Chi phí lá trang trí và cành trang trí CHƯA được cộng vào `quotePrice` — hợp đồng Vision (`bom.wrapping`/phần lá) không có `quantity` cho hai loại này (điểm lệch #8, `RA_SOAT_THU_HOACH.md`), nên không có số để nhân đơn giá | Chủ sản phẩm chốt 09/10 (AskUserQuestion trong phiên P6): để nợ kỹ thuật — công thức chạy đúng mà không cộng khoản này, thay vì đoán một con số kinh doanh không có căn cứ | Khi có dữ liệu thật hoặc bộ ảnh vàng đạt nghiệm thu (nợ #24) để chốt cách tính |
| 28 | `mucThu.ts` (363 dòng) và `uocPhi.ts` (132 dòng) bị `HARVEST_MANIFEST.md`/`RA_SOAT_THU_HOACH.md` xếp REUSE cho M02 ("Mức thu"/"Ước phí") nhưng đọc mã thật thì không liên quan tới giá sản phẩm: `mucThu.ts` là bảng UAT/nghiệm thu năng lực Điều hành (giá trị/cách thử/đạt khi), `uocPhi.ts` là ước phí lượt phân tích ảnh AI + trần ảnh/ngưỡng chi tiêu — thuộc M01/Usage, đã có `usage/domain/pricing.ts` riêng từ P3. Không tệp nào trong hai tệp này được mang sang ở P6 | Đọc mã trước khi harvest thay vì theo tài liệu (đúng bẫy `AGENTS.md` đã cảnh báo — "đọc mã trước khi xếp hạng, đừng xếp theo trí nhớ") — phát hiện khi soát nguồn cho P6 09/10 | Sửa `HARVEST_MANIFEST.md` mục 3.1 (bỏ `mucThu.ts` khỏi R5) và thêm điểm lệch #10 vào `RA_SOAT_THU_HOACH.md` — đã làm cùng đợt này |
| 29 | `sanTran.ts` (bản gốc, 102 dòng) bị xếp REUSE trong `HARVEST_MANIFEST.md` nhưng KHÔNG thuần — có `import 'server-only'` và gọi thẳng một dịch vụ Excel qua `goiDichVu()`/`docHeThong()`. Chỉ phần quyết định (`quyetDinhChan`, đã nằm trong `chanGia.ts`) là REUSE thật; phần tra số phải viết lại thành `PricingRuleRepository` đọc `pricing_rules` — đã làm ở P6 | Đọc mã trước khi harvest — cùng bẫy với nợ #28 | Đã trả trong P6: `price-guard.ts` chỉ mang `quyetDinhChan`, không mang phần gọi dịch vụ Excel |

| ~~30~~ | **ĐÃ TRẢ 09/10 (P9).** `approveOptimization` (`POST /media/optimizations/:id/approve`, `I2`) là đường DUY NHẤT đặt `assets.approval_state = APPROVED`, ghi cùng `audit_logs` trong một giao dịch. `GET /integration/products/:id/master-image` nay trả 200 sau khi ảnh được duyệt — có ca thử `tests/tenant/media-optimizations.test.ts` gọi endpoint đó TRƯỚC (404) và SAU (200) lượt duyệt trong cùng một ca | Cột thêm ở P7 để dựng đúng endpoint đọc theo đặc tả 08 mục 4 ngay lúc đó, thay vì hoãn cả endpoint tới P9 | — Đã trả |
| 31 | `POST /integration/jobs` chấp nhận mọi giá trị `feature`, không có danh sách trắng theo `client` (`LOCALBUDD` lẽ ra chỉ nên tạo job M05/M06, `SocialFlow` chỉ M04b/M07) | Đặc tả 06 mục 11 và đặc tả 08 không nói tới việc giới hạn `feature` theo loại engine; hạn mức/credit (`enqueueJob`, `YC-U3`) vẫn chặn đúng bất kể `feature` là gì — đây là thiếu chặt chẽ về phạm vi, không phải một lỗ hổng hạn mức | Xác nhận với chủ sản phẩm có cần bảng ánh xạ `client → feature được phép` hay không, trước khi cấp token thật cho `LocalBudd`/`SocialFlow` production |

| 32 | Sàn/Trần theo mã sản phẩm (`Giá chào thấp nhất`/`Giá chào cao nhất` của AVI GIFT) lưu ở `products.attributes.priceGuard`, KHÔNG mở rộng `pricing_rules` sang phạm vi theo-sản-phẩm | Chốt với anh Tony 09/10 (AskUserQuestion, phiên P8): mở `pricing_rules` sang phạm vi sản phẩm là thay đổi kiến trúc M02 nói chung, ngoài phạm vi P8 (chỉ "nạp dữ liệu"). `checkPriceGuard` (`price-guard.ts`, P6) đã có sẵn interface `FloorCeilingLookup` theo mã — chưa có route/use-case nào đọc từ `products.attributes` để dựng `FloorCeilingLookup` đó | Khi có route "tra Sàn/Trần lúc chào giá" dùng thật — quyết định đọc từ `products.attributes` hay chuyển hẳn sang `pricing_rules` theo phạm vi sản phẩm |
| 33 | `excel_parser.py` (v1) dò cột ảnh qua bốn tên `Link ảnh`/`Link Ảnh`/`Ảnh`/`Link_Anh` — không tên nào khớp cột thật của dữ liệu AVI GIFT (`Đường dẫn ảnh`). Xem điểm lệch #12, `RA_SOAT_THU_HOACH.md` | Đọc mã trước khi harvest lật ra sai lệch — cùng bẫy với nợ #28/#29 | Đã trả trong P8: `scripts/nap-avi-gift/doc-excel.py` không mang theo lỗi dò tên cột của bản gốc, đọc đúng `Đường dẫn ảnh` |
| ~~34~~ | **VIẾT MÃ XONG 09/10, chờ chạy thật.** Phần ảnh thật của P8 đã dựng: `scripts/nap-avi-gift/doc-phan-tich.py` (đọc `ket-qua/results.jsonl` + kiểm kê `images/`, chạy thật cho **8 lượt phân tích / 16 ảnh**), `domain/analysis-mapping.ts` (thuần, 8 test), `use-cases/import-analyses.ts`, `scripts/nap-avi-gift-phan-tich.ts`, và `tests/tenant/avi-gift-analyses.test.ts` (8 ca). Con số thật là **8**, không phải "9–14" như ước lượng ban đầu — `results.jsonl` có đúng 8 dòng `status: OK`; năm thư mục ảnh còn lại rỗng. Năm mã nối vào danh mục 1.316 có sẵn, ba mã (`GHTM`, `MM17082026`, `KG-20260831-001`) không có trong danh mục nên tạo `products` mới, đánh dấu `attributes.aviGiftImport.notInPriceCatalog = true` (chốt với anh Tony 09/10) | Nguồn là `results.jsonl` chứ KHÔNG phải `Product_Master.xlsx`: tệp jsonl là đầu ra MÁY của v1 (`schema_version` 10), còn Product_Master.xlsx là bản trình bày suy ra từ nó cho người đọc — nạp bản trình bày rồi gọi nó là `raw` là ghi sai nguồn. Lỗi dữ liệu của v1 không mang sang: cột `Mã sản phẩm` của Product_Master ghi `BHSK0001/BHSK0001`, dính cả tên thư mục | Còn lại: chạy `npm run nap:phan-tich -- --org-id=…` trên Postgres thật, rồi đối chiếu `BAN_GIAO.md` và tích ô "Dữ liệu nhập đủ" |
| 35 | `bootstrapAviGiftOrganization` (P8) sinh mật khẩu tạm ngẫu nhiên cho tài khoản admin AVI GIFT (`antranhub@gmail.com`) — core chưa có luồng "bắt buộc đổi mật khẩu lần đăng nhập đầu" | Ngoài phạm vi P8 (nạp dữ liệu); chưa có đặc tả nào cho luồng đổi mật khẩu bắt buộc ở core | Trước khi tài khoản admin AVI GIFT dùng thật — anh Tony đổi mật khẩu ngay sau lần đăng nhập đầu, thủ công, cho tới khi luồng này có |
| 36 | `FloraOS Vận hành/he_thong.json` (dữ liệu vận hành thật của AVI GIFT, đọc trong lúc khảo sát P8) chứa `openai_api_key` ở dạng CHUỖI THÔ, không mã hoá | Phát hiện ngoài ý muốn lúc đọc cấu trúc thư mục nguồn cho P8 — không phải một phần của lượt nạp (script `doc-excel.py` không đọc tệp này) | **Khẩn** — anh Tony xoay khoá OpenAI này ngay trên dashboard OpenAI, không chờ tới lượt nạp P8 tiếp theo. Không tệp nào trong `scripts/nap-avi-gift/` được đọc hay chép `he_thong.json` |

| 37 | Nạp credit cho một tổ chức chỉ làm được bằng `scripts/nap-credit.ts` chạy tay trên máy có quyền truy cập cơ sở dữ liệu — không có endpoint HTTP nào | Chốt với anh Tony 09/10 (AskUserQuestion, phiên soát P1–P8): mở endpoint đòi một mã năng lực "quản trị nền tảng" mà bộ 114 mã chưa có, VÀ một khái niệm quản trị đứng NGOÀI mọi tổ chức mà đặc tả chưa định nghĩa — cả hai là thay đổi kiến trúc, không phải việc mở khoá vận hành. Script gọi `OrganizationRepository.topUpCredit`, đường duy nhất | Khi có mô hình bán hàng thật (gói credit, thanh toán) — lúc đó mới cần một mặt quản trị nền tảng đúng nghĩa |
| 38 | `bootstrapAviGiftOrganization` dựng tổ chức với `credit_balance = 0` và workspace `PRODUCTION`, nên MỌI `enqueueJob` bị `quotaExceeded("Không đủ credit")` cho tới khi có người chạy `scripts/nap-credit.ts` | Con số credit khởi tạo là quyết định kinh doanh, không phải giá trị kỹ thuật — cấy một hằng số vào mã là đoán thay chủ sản phẩm. `nap-avi-gift-vao-core.ts` in sẵn lệnh nạp kèm `organization_id` ngay sau khi bootstrap để không ai quên | Trước ngày cắt (P11) — anh Tony chốt số credit cấp cho AVI GIFT và chạy lệnh |

Đã trả ngày 09/09 (P1): nợ #1 — `npm run test:tenant` nay xanh thật trên bộ test cách ly, tệp thất bại có chủ đích đã gỡ.

Đã trả ngày 09/09: con số trần cứng (18) · dải mã `E1–E8` · đường dẫn `maChucNang.ts` · hạng thu hoạch `count_engine` và `color_engine` · quyết định D1, D2, D3, D4.

Đã trả ngày 09/09 (P5): sự cố sandbox `Cannot find module '@rollup/rollup-linux-arm64-gnu'` chặn `npx vitest`/`npx tsc` — sửa bằng `npm install @rollup/rollup-linux-arm64-gnu --no-save` (kiến trúc arm64 sai trong `node_modules` đã cài sẵn), cho phép chạy thật `vitest`/`tsc --noEmit` trong sandbox từ nay, không còn phải viết mã rồi để đó chưa xác minh được kiểu.

Đã trả ngày 09/10 (phiên soát P1–P8):

- **CI trên `main` đỏ từ P7** — `.github/workflows/ci.yml` thiếu `INTEGRATION_TOKEN_SECRET` mà
  `src/lib/env.ts` bắt buộc từ P7. Bước `npm run db:seed` ném ở dòng import, TRƯỚC `typecheck`, nên
  cổng bắt buộc `test:tenant` chưa từng chạy trên CI suốt P7 và P8. Đã thêm biến vào workflow.
- **P8 không có ca thử nào chạm cơ sở dữ liệu** — đã thêm `tests/tenant/avi-gift-import.test.ts`
  (9 ca) và một ca còn thiếu cho `GET /integration/brand-profile`.
- **`enqueueJob` trả 500 khi hai request cùng `Idempotency-Key` vào đồng thời** — cửa kiểm trùng lặp
  đọc TRƯỚC giao dịch nên cả hai qua được, người thua vỡ ở chỉ mục duy nhất. Dữ liệu vẫn đúng (giao
  dịch cuộn lại, không trừ credit hai lần) nhưng mã lỗi sai. Đã bắt và trả lại job của người thắng
  (`isDuplicateIdempotencyError`, thuần, có test).
- **`importCatalog` chạy 1.316 lượt `findByCode`** — đổi sang `ProductRepository.listExistingCodes`
  (một lượt `IN (…)` mỗi 500 mã), và chặn luôn trường hợp hai dòng trùng mã trong CÙNG tệp nguồn
  (trước đó sẽ vỡ ở `@@unique([organization_id, code])`).
- **`next.config.ts`** — `experimental.typedRoutes` đã dời lên cấp cao nhất ở Next 16.3.
- **Số liệu nguồn AVI GIFT ghi sai trong `TRANG_THAI.md`** — BOM thật là 5.862 dòng/1.297 mã, không
  phải 5.872/1.300. Ghi thêm: chỉ 27/1.316 SKU có đủ cả Sàn và Trần (nên chỉ 27 dòng nhận
  `attributes.priceGuard`), và 3 SKU không có Giá bán.

Đã trả ngày 09/10 (chạy `test:tenant` lần đầu cho nợ #34):

- **`as never` ở bốn tệp Json của P3 — nay đã trả hết.** Nợ này ghi từ P4
  ("`as never` chỉ còn là nợ của bốn tệp P3", `business-profile-repository.ts`)
  và 09/10 nó gây ra một lỗi thật: `createCompletedHistorical` ghi một object
  vào `generation_jobs.result`, mà cột đó là `String?` chứ không phải Json.
  `as never` nhận MỌI giá trị nên `tsc` im lặng cho qua, `eslint` cũng vậy —
  lỗi chỉ lộ khi chạy trên Postgres thật (8 ca đỏ). Đã đổi hết sang
  `InputJsonValue` ở `usage`/`audit`/`job_events`/`assets`/`generation_jobs`,
  và `null as never` thành `Prisma.DbNull` (NULL của SQL, khác `JsonNull` là
  chuỗi JSON `null` nằm TRONG cột — một phân biệt mà `as never` che mất).
  Không còn `as never` nào trong `src/`.
- **`generation_jobs.result` dùng sai nghĩa.** Cột này là PHÁN QUYẾT nghiệp
  vụ (`APPROVED`/`REJECTED`/`WARNING` của Identity Guard, P9 — xem
  `job-rules.ts`), không phải chỗ chứa số liệu lượt chạy. Lượt nạp lịch sử
  không đi qua cổng nào nên không có phán quyết để ghi: `result = null`, số
  liệu chuyển sang `payload` (cột Json đúng nghĩa).

Đã trả ngày 09/10 (P9 đợt một):

- **Nợ #30** — xem dòng đã gạch ở bảng trên.
- **`OrganizationRepository.refundCredit` không có ai gọi.** D3 chốt từ 09/09
  ("job bị Identity Guard từ chối không tính phí khách; credit hoàn lại")
  nhưng tới trước P9 không có mã nào thực thi — đúng tình trạng `addCredit`
  trước sáng nay. Nay có `refundRejectedJob` + `npm run hoan-credit`.

Nợ mới ghi ngày 09/10 (P9 đợt một):

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 39 | Chưa có tăng cường ảnh thật — chỗ `ImageEnhancer` cắm `PassthroughEnhancer`, trả đúng byte đưa vào. Ba cổng `Segmenter`/`BackgroundProcessor`/`Upscaler` khai mà chưa hiện thực. `outputs.ratios` (Smart Reframe) trả object rỗng | Chốt với anh Tony 09/10: làm Identity Guard trước. Passthrough KHÔNG giả vờ là enhancer — tên gọi nói thẳng, `generated_flags` đều `false` đúng sự thật, và nó cho một phép thử có đáp án biết trước (ảnh so với chính nó phải ra `SAFE`) mà không adapter thật nào cho được | Đợt hai của P9 — chọn provider theo Technology Selection Matrix (`YC-N5`/`YC-N6`, cũng là mục còn lại của P5) |
| 40 | Hoàn credit (D3) nhất quán SAU MỘT KHOẢNG, không tức thì: worker ra phán quyết `REJECTED` nhưng không được ghi `usage` (`YC-U4`), nên credit chỉ hoàn ở lần chạy `npm run hoan-credit` kế tiếp | `YC-U4` là luật cứng — hạn mức và credit là việc của core, worker không đụng. Đổi sang hoàn tức thì đòi một kênh worker→core mà D6-1 cấm (chỉ nói chuyện qua bảng) | Khi có yêu cầu vận hành thật về độ trễ hoàn credit — lúc đó cân nhắc một tiến trình core `LISTEN` trên kênh job thay vì cron |
| 41 | Khối bốn điểm của Guard lưu ở `job_events` (`event = "guard"`), không có cột riêng | Đặc tả 07 không khai bảng nào cho M04a, và chỗ CẦN đọc khối này nhất là lúc bị từ chối — đúng lúc không có `assets` nào được tạo để gắn metadata vào | Nếu M04a có bảng riêng ở một pha sau, chuyển sang cột thật và giữ `job_events` làm nhật ký |

Nợ mới ghi ngày 09/10 (đợt đồng bộ ba repo):

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 42 | ~~`tests/tenant/integration-sso.test.ts` (7 ca) CHƯA chạy trên Postgres thật~~ **ĐÃ TRẢ 09/10 21:56** — anh Tony chạy `npm run test:tenant` trên Postgres thật: 108/108 xanh trên 13 tệp, gồm cả 7 ca mới | Cùng giới hạn đã gặp ở P5/P8/P9: mã và `tsc`/`eslint`/`npm test` xanh trong sandbox, phần cần DB thật thì anh Tony chạy trên Terminal Mac | Ngay lần chạy `npm run test:tenant` kế tiếp trên máy thật — đây là điều kiện nghiệm thu, không phải việc tuỳ nghi |
| 43 | Nhánh SSO của `/integration/*` xác thực bằng JWT stateless: người bị thu hồi phiên gốc (`sessions.revoked_at`) vẫn gọi được cho tới khi JWT hết hạn (tối đa 15 phút) | Đây là bản chất JWT, đã cân nhắc khi chốt TTL ngắn ở B1. Tư cách thành viên thì kiểm lại mỗi lời gọi (`tenantContextFor`), nên người bị gỡ khỏi tổ chức mất quyền NGAY — chỉ việc thu hồi phiên là có độ trễ | Khi có yêu cầu vận hành thật về thu hồi tức thì — lúc đó thêm một lượt tra `sessions` ở nhánh SSO, đổi lấy một truy vấn mỗi lời gọi |
| 44 | `LocalBudd` không gọi `POST /integration/usage`. Chi phí thật phát sinh ở engine ngoài (LLM sinh trang, ComfyUI) không chảy về `usage` của core — core chỉ ghi credit tại điểm tạo job | Ngoài phạm vi đợt này. Cổng chặn hạn mức (`createJob`) đã đóng, nên tổ chức hết credit không sinh trang được; phần còn thiếu là ĐỘ CHÍNH XÁC của chi phí, không phải cái cổng | Khi có bảng giá thật theo chi phí nhà cung cấp — cùng lúc với nợ #14 |
| 46 | ~~**`npm run test:tenant` xoá sạch cơ sở dữ liệu PHÁT TRIỂN.**~~ **ĐÃ TRẢ 09/10** — `test:tenant` trỏ sang `floraos_test` (`DATABASE_URL_TEST` đè được cho CI), `npm run db:test:setup` dựng database đó, và `tests/helpers/database.ts` TỪ CHỐI chạy khi tên database không kết thúc bằng `_test`, kèm câu lỗi nói thẳng phải chạy lệnh gì. Mô tả gốc: `tests/helpers/database.ts` `TRUNCATE` 22 bảng (gồm `users`/`organizations`/`products`) và dùng CHUNG `DATABASE_URL` với môi trường dev — không có database test riêng | Bộ test cách ly phải bắt đầu từ CSDL rỗng, nếu không thì "không tìm thấy" có thể do dữ liệu sót chứ không do bộ gác. Chuyện đó đúng; cái sai là nó chạy trên đúng database chứa dữ liệu thật của AVI GIFT | Sớm. `AGENTS.md` bắt `test:tenant` xanh trước MỌI merge, nên cứ mỗi lần merge là mất dữ liệu dev — đã mất thật ngày 09/10 lúc 21:56, phải chạy lại `nap:danh-muc` + `nap:phan-tich`. Cách trả: database riêng (`floraos_test`) cho `test:tenant`, cộng một chốt chặn từ chối chạy khi tên database không kết thúc bằng `_test` |
| 45 | `SocialFlow` chưa nối gì với core: không middleware SSO, không client HTTP, `organization_id` vẫn là chuỗi `"default"` chứ không phải UUID tổ chức thật | Nhóm B3 của `UNIFIED_SHELL.md`, chưa nằm trong phạm vi đợt 09/10 (anh Tony chốt phạm vi Đợt 0+1+2) | Đợt 3 của `RA_SOAT_DONG_BO_BA_REPO.md` mục 5 |


Nợ mới ghi ngày 09/11 (nối Dashboard Điều hành `/` với dữ liệu thật — GET
/jobs, GET /products, GET /usage/summary, cookie phiên đọc thật ở
`(app)/layout.tsx`):

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 47 | `AdminDashboard` fetch dữ liệu qua `fetch()` trong `useEffect` rồi `setState` — `eslint-config-next/core-web-vitals` (`react-hooks/set-state-in-effect`) coi đây là lỗi, không chỉ cảnh báo. Đã tắt rule tại chỗ cho khối `useEffect` đó | Đây là component đầu tiên trong app gọi API thật phía client — repo chưa có SWR/TanStack Query hay quy ước fetch nào khác để theo. Tắt rule tại một chỗ, không tắt toàn cục | Khi chọn một thư viện fetch/cache phía client (SWR hoặc TanStack Query là hai lựa chọn hợp lý nhất với Next App Router) — lúc đó viết lại theo đúng khuôn của thư viện, không còn `useEffect` gọi thẳng `fetch` |
| 48 | Khối "Hàng chờ duyệt" trên Dashboard hiện "Sắp có", không hiển thị dữ liệu thật | `vision.analyses` và `media.optimizations` chỉ có `POST` (tạo, duyệt) — CHƯA có `GET` liệt kê bản ghi đang chờ duyệt (`result IS NULL` hoặc tương đương). Giả một danh sách rỗng hoặc dùng lại dữ liệu mẫu cũ sẽ sai hơn là nói thẳng chưa có | Viết `GET /vision/analyses` + `GET /media/optimizations` (lọc theo trạng thái chờ duyệt), theo đúng khuôn phân trang con trỏ đã dùng ở `listJobs`/`listProducts` — cần soát lại năng lực (`H1`/`H3`/`I1`/`I2`) trước khi mở endpoint đọc mới |

Nợ mới ghi ngày 09/11 (soát mức sẵn sàng triển khai M01 — Phân tích ảnh sản phẩm):

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 49 | Job `CANCELLED` và job `FAILED` KHÔNG được hoàn credit. `refundRejectedJob` chỉ nhận job `COMPLETED` mang phán quyết Guard (`isGuardResult`), đúng phạm vi D3 — nhưng credit trừ tại điểm `enqueueJob` nên người dùng huỷ một lượt đang xếp hàng, hoặc gặp một lượt hỏng vì lỗi kỹ thuật, vẫn mất credit của lượt đó | D3 chốt ngày 09/09 chỉ nói về job bị Identity Guard từ chối; hai trạng thái này chưa có quyết định kinh doanh nào phủ. Không tự cấy một luật hoàn tiền vào mã là đoán thay chủ sản phẩm | Chủ sản phẩm chốt chính sách cho `CANCELLED` (khách chủ động dừng) và `FAILED` (nền tảng hỏng) — hai ca có lý lẽ khác nhau, không nhất thiết cùng một quyết định |
| 50 | Hợp đồng `Schema.json` không có `flower_count`, `bud_count`, `damaged_count`. `BO_ANH_VANG.md` mục 6 khai đúng bốn trường đó trong lược đồ nhãn và mục 9 chấm điểm chính trên `flower_count` — máy và thước đo hiện không chia sẻ trường nào để so | Hợp đồng chỉ được THÊM trường (`YC-N3`), nên thao tác này hợp lệ; nhưng phép suy `flower_count` từ `bom.flowers[].quantity` phải chốt trước khi thêm, vì quy ước đếm 3 tính theo cành còn `dvt_dem` mở nhiều đơn vị | Cùng đợt nghiệm thu bộ ảnh vàng (nợ #24) — không đo được provider nào cho tới khi hai bên có chung một trường |
| 51 | `bom.foliage[].quantity` là trường bắt buộc trong hợp đồng, trong khi `QUY_UOC_DEM.md` quy ước 4 yêu cầu lá và cành trang trí ghi tên và **không đếm số** (`count` để trống) | Hợp đồng thu hoạch nguyên vẹn từ v1 (R1), quy ước đếm chốt sau. Hai tài liệu đang nói hai điều khác nhau về cùng một trường | Cùng đợt với nợ #50 — chốt một trong hai bên rồi sửa bên còn lại, không để cả hai cùng đứng |
| 52 | Không có đường nào đưa `product_analyses.approval_state` về `REJECTED`. Giá trị này có trong enum của lược đồ, có trong kiểu TS, `canApproveAnalysis`/`canEditAnalysis` đều xử lý nó — nhưng không endpoint nào đặt nó. Một kết quả sai không bỏ đi được, nó nằm lại hàng chờ duyệt vĩnh viễn | Đặc tả 06 mục 8 chỉ khai `POST /approve`, không khai `POST /reject`. Thêm một endpoint đổi trạng thái nghiệp vụ là quyết định sản phẩm, không phải chỗ trống kỹ thuật | Chủ sản phẩm xác nhận người soát cần "bỏ" một kết quả hay chỉ cần sửa rồi duyệt — cùng lúc với nợ #22 (thu hồi duyệt) |
| 53 | Chưa có công cụ chấm điểm bộ ảnh vàng. `BO_ANH_VANG.md` mục 9 định nghĩa sáu chỉ số (đếm đúng tuyệt đối, sai số tuyệt đối trung bình, tỉ lệ sai nặng, độ khớp cấu phần, độ khớp màu, chi phí và thời gian) và cổng đổi provider dựa vào chúng; không có mã nào tính | Chỉ số tính trên `flower_count`, mà trường đó chưa có ở phía máy (nợ #50). Viết bộ chấm trước khi chốt phép suy là viết vào chỗ trống | Ngay sau nợ #50 — trước khi có nhãn thật thì bộ chấm không chạy được, nhưng nó phải sẵn sàng đúng lúc nhãn xong |
| 54 | `workers/.venv-worker` trên máy phát triển dựng bằng Python 3.9.6 (CommandLineTools), trong khi `workers/pyproject.toml` khai `requires-python = ">=3.11"` và `[tool.ruff] target-version = "py311"` | Môi trường máy, không phải mã nguồn. Ghi lại vì nó có hệ quả thật: bộ test worker chưa từng chạy được bằng chính venv của repo | Dựng lại venv bằng Python 3.11 trở lên trước khi đưa worker lên máy chủ thật |

Đã trả ngày 09/11 (đợt soát mức sẵn sàng triển khai M01):

- **Nợ #49** — hoàn credit nay phủ ba diện, luật ở `usage/domain/refund-policy.ts`
  (`lyDoHoanCredit`, thuần, 6 ca thử): Guard từ chối (D3, như cũ), job bị huỷ,
  job hỏng vì lỗi kỹ thuật. `refundRejectedJob` đổi tên thành `refundJob` và
  chuyển sang `modules/usage/use-cases/` — nó không còn là việc riêng của
  M04a. `GenerationJobRepository.listRejected` thành `listRefundable`, quét
  mọi `feature` thay vì chỉ `media.optimize`, nên lượt phân tích ảnh hỏng
  cũng được hoàn. `npm run hoan-credit` không đổi cách gọi.
- **Nợ #50** — hợp đồng nay mang ba tổng đếm. Chúng KHÔNG hỏi mô hình mà cộng
  từ `bom` ngay sau khi nhận đáp ứng (`vision/analyzer/dem_tong.py`, thuần,
  9 ca thử), nên không bao giờ có hai giá trị bất đồng trong cùng một bản
  ghi. `Schema.json` thêm `so_nu` và `so_hong` cho mỗi dòng hoa — trước đó
  hợp đồng không có chỗ nào khai nụ, nên quy ước đếm 1 và 6 không thực thi
  được. Đơn vị giữ theo `dvt_dem` của từng loài, đúng quy ước đếm 3.
- **Nợ #51** — không phải mâu thuẫn lược đồ: `bom.foliage[].quantity` vốn đã
  là `["integer","null"]`. Thiếu sót nằm ở `Prompt.md`, nay có mục "Lá và
  cành trang trí không đếm số" bảo mô hình khai `null` ở trường đó.
- **Nợ #52** — `POST /vision/analyses/:id/reject` (`H3`), luật thuần
  `canRejectAnalysis` (chỉ `PENDING`), ghi `audit_logs` action
  `product.reject` trong cùng giao dịch, `ly_do` tuỳ chọn vào phần `after`.
  Không chạm Product Master. Có nút trên cả màn kết quả lẫn hàng chờ duyệt.
- **Nợ #53** — `GET /vision/analyses/export` (`H3`) trả CSV mã hoá UTF-8 kèm
  BOM, một dòng cho mỗi cấu phần, cột `nguon` phân biệt số của máy với số của
  người (`domain/analysis-export.ts`, thuần, 11 ca thử). Đây là tệp đối soát
  vận hành, chưa phải bộ chấm điểm bộ ảnh vàng — bộ đó chờ nhãn thật (nợ #24).

Ba lỗ chặn triển khai đóng cùng đợt, không có dòng nợ riêng vì chúng là lỗi
chứ không phải đánh đổi có chủ đích:

- **`POST /assets` nhận `storage_key` bất kỳ từ client.** Bản ghi mang
  `organization_id` đúng nên mọi bộ lọc tenant cho qua, nhưng đường dẫn trỏ
  được sang `org/<tổ-chức-khác>/…` (đọc ảnh xuyên tổ chức, vỡ luật 1 và 2)
  hoặc ra ngoài kho bằng `..`. Nay `storageKeyMatchesContext` dựng lại đường
  dẫn hợp lệ duy nhất phía máy chủ và so khớp; worker rào lần hai lúc đọc.
- **Job lô hỏng giữa chừng nhân đôi kết quả khi chạy lại.** `product_analyses`
  nay có `@@unique([job_id, asset_id])`; worker bỏ qua ảnh đã xong và ghi
  kèm `ON CONFLICT DO NOTHING`. `conn.rollback()` trong nhánh lỗi đã gỡ — nó
  không làm gì trên kết nối `autocommit` và che mất đúng sự thật đó.
- **Worker thoát hẳn khi gặp sự cố hạ tầng.** `run_worker` nay nối lại theo
  thang lùi 1→60 giây; ghi nhật ký không làm chết tiến trình; `SIGTERM` để
  job đang chạy kết thúc rồi mới thoát.

Siết thêm cùng đợt: lời gọi nhà cung cấp có hạn 120 giây và thử lại hai lần;
đáp ứng bị cắt vì chạm trần token, bị từ chối, hay rỗng đều có câu lỗi riêng
thay vì `JSONDecodeError`; ảnh thu về cạnh dài 1400 px theo `config.json`
(tệp đó trước nay được nạp rồi không ai đọc); `PATCH /vision/analyses/:id`
từ chối bản sửa bỏ sót khoá máy đã trả, vì bản sửa thay NGUYÊN bản gốc nên
thiếu khoá là âm thầm xoá trắng trường tương ứng trong Product Master; lượt
sửa nay ghi `audit_logs` action `product.analysis_edit`; `requirements.txt`
nâng lên `psycopg>=3.2` vì `notifies(timeout=…)` có từ bản đó.

Ghi ngày 09/11 (đợt ba bộ máy phân tích ảnh):

Cổng `VisionAnalyzer` nay có ba hiện thực, chọn ở cấp tổ chức. Cả ba trả cùng
hợp đồng `PhanTichSanPhamHoa`, nên Review, Approve, Product Master, M02 và
M03 không biết bộ nào đã chạy — đúng D5-c (cổng ở mức hợp đồng JSON).

| Khoá | Tên hiển thị | Cách chạy | Trạng thái |
|---|---|---|---|
| `openai_structured` | Đầy đủ | Đo bảng màu tại chỗ → gửi ảnh kèm bảng màu và `Prompt.md` (3.536 token) → một hoặc hai lượt, đồng thuận trung vị | Đã chạy thật |
| `openai_direct` | Gọn | Gửi thẳng ảnh kèm `PromptGon.md` (~600 token), một lượt, không tiền xử lý | Chưa đo trên bộ ảnh vàng |
| `local_cv` | Cục bộ | SAM2 tách → Florence-2 gọi tên → `color_engine` (chưa nối) → lắp ráp. Ảnh không rời hạ tầng | Có hiện thực, CHƯA chạy thử trên trọng số thật (nợ #55) |

Đường chọn: `organizations.settings.bo_may_phan_tich` (cùng khối với
`cho_phep_tu_duyet`, không dựng bảng mới) · `GET /vision/engine` (`H1` — ai
chạy phân tích cũng xem được bộ nào đang chạy) · `PUT /vision/engine` (`H4`,
mã năng lực mới, trần cứng `dieu_hanh`) · màn `/bo-may`.

Bộ máy **chốt vào `payload` của job lúc tạo**, worker không tra lại lúc nhận
việc. Điều hành đổi bộ máy giữa lúc một lô đang xếp hàng thì lô đó vẫn chạy
bằng bộ đã chọn khi bấm nút — nếu không, hai ảnh cùng một lô có thể chạy
bằng hai bộ khác nhau và không ai biết. Mỗi lần đổi ghi `audit_logs` action
`vision.engine.change`.

Danh mục năng lực: 114 → 115 mã, trần cứng 31 → 32. `H4` nằm ở dải mã mới
(F–L) nên bộ 76 mã thu hoạch (A–E) không đổi.

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 55 | `local_cv` CÓ hiện thực `BoTachThucThe`/`Sam2Segmenter` và `BoGoiTen`/`Florence2Labeler`, đăng ký thật trong `registry._dung_local_cv`. **ĐÃ CHẠY THỬ THẬT THÀNH CÔNG 2026-09-11** trên máy thật (Apple Silicon, MPS, SAM2.1 Hiera Small + Florence-2-base) — ảnh `golden/images/g043.jpg`: SAM2 tách 37 thực thể hợp lý, pipeline đầy đủ qua `registry.lay_provider("local_cv").analyze()` ra đúng hình dạng `Schema.json`, `flower_count=18`, `confidence=55` (đúng trần đã định vì chưa có bộ phân loại — nợ #56), checklist tự suy đúng | Hai vướng đã gặp và đã sửa khi chạy thật: (1) `microsoft/Florence-2-base` (mã từ xa `trust_remote_code`) vỡ với `transformers>=4.52.1` nói chung và `5.17.0` cụ thể (`AttributeError: forced_bos_token_id`, rồi `EncoderDecoderCache.layers` ngay trong `generate()` của chính `transformers`) — chuyển sang `florence-community/Florence-2-base` (hỗ trợ Florence-2 NGUYÊN BẢN từ `transformers>=5.15.1`, không cần `trust_remote_code`) và ghim đúng `transformers==5.15.1` trong `requirements-local-cv.txt`; (2) gói `sam2` trên PyPI KHÔNG phải của Meta (bên thứ ba, bản cuối 12/2024) — cài đúng bản chính thức bằng `git clone facebookresearch/sam2` + `pip install -e ".[notebooks]"`. Quan sát MỚI, chưa phải lỗi: SAM2 tách nhiều mặt nạ chồng lấp (cả bó hoa lẫn từng phần con của nó), và `<CAPTION>` mô tả nguyên khung cắt nên vài dòng `bom` gần như lặp ý nhau — cùng gốc với nợ #56 (chưa có bộ phân loại loài để gộp/rút gọn nhãn), ghi thêm ở nợ #60 | **Đã đổi 09/11** — `trang_thai` `local_cv` từ `chua_san_sang` sang `thu_nghiem` (ngang `openai_direct`), chốt qua AskUserQuestion với chủ sản phẩm, đúng quy trình D5-c (không tự quyết một mình). Còn lại: đổi bộ MẶC ĐỊNH của cả ba vẫn chờ đo trên bộ ảnh vàng, không đổi bằng lập luận |
| 56 | `local_cv` không có bộ phân loại loài THỊ GIÁC theo danh mục cửa hàng. **Giảm nhẹ một phần 09/11** (theo yêu cầu chủ sản phẩm): `local_cv_species.doan_ma_loai` so CHỮ nhãn thô của Florence-2 với alias tiếng Anh trong `contracts/species_catalog.json` (86 loài trích từ `FloraOS Vận hành/01_NHAP-LIEU.xlsx` sheet "02 Danh mục loại", 2026-09-11) — khớp rõ MỘT loài thì gán `ma`/tên chuẩn, nhập nhằng hoặc không khớp thì vẫn `ma: null` như cũ. `confidence` VẪN giữ trần 55 bất kể có khớp được mã hay không — chưa có đo lường trên bộ ảnh vàng để biện minh nâng trần (D5-c) | Đây KHÔNG phải bộ phân loại thị giác — chỉ so chữ với đúng nhãn Florence-2 tự nhả ra, không nhìn lại ảnh. Không dùng được cho các trường hợp Florence-2 mô tả sai chủ thể, hoặc loài không có alias tiếng Anh trong danh mục (khoảng 15/86 loài, xem `species_catalog.json`). Sheet "08 Cặp dễ nhầm" (63 cặp, dấu hiệu THỊ GIÁC) chưa dùng tới — chỉ có ích khi có bộ phân loại thị giác thật | Trả HẾT khi có bộ phân loại thị giác thật — cần ảnh có nhãn loài để huấn luyện, tức cùng chỗ nghẽn với bộ ảnh vàng (nợ #24) |
| 57 | `local_cv` khai bảy trong mười ô `checklist` là "Không có" vì chưa phân biệt được vai trò từng loài | `Schema.json` không cho `null` ở các ô này. `confidence` thấp của cả bản ghi là thứ nói ra rằng phần này chưa nên tin | Cùng đợt với nợ #56 |
| 58 | Cả ba bộ máy thu cùng `vision.analyze = 1` credit, dù chi phí thật chênh nhau nhiều lần | Chốt với chủ sản phẩm 09/11: giữ một mức, nền tảng chịu phần chênh. Bảng giá theo bộ máy là quyết định kinh doanh, chưa có mô hình bán hàng thật (cùng lý do nợ #14) | Khi có quyết định kinh doanh về gói giá |
| 59 | `openai_direct` chưa đo trên bộ ảnh vàng, nên chưa có căn cứ nói nó đếm kém hơn hay hơn bộ đầy đủ | `BO_ANH_VANG.md` mục 9: "Không đổi bằng lập luận". Màn `/bo-may` nói thẳng điều này thay vì bày ba lựa chọn trông ngang nhau | Cùng đợt nghiệm thu bộ ảnh vàng (nợ #24) |
| 60 | `local_cv` tách nhiều mặt nạ SAM2 chồng lấp cho cùng một vật thể (cả bó hoa lẫn từng bông con trong đó), và `Florence2Labeler` mô tả nguyên khung đã cắt chứ không riêng vùng mặt nạ — sinh nhiều dòng `bom` gần trùng ý nhau thay vì gộp lại. **Giảm nhẹ một phần 09/11 lần hai** (chủ sản phẩm báo lại vẫn thấy dòng mô tả nhầm nền — cánh tay, cái đĩa, tấm ga, con thuyền — trên ảnh thật `KG-20260904-004-1`): thêm `_loc_chong_lap` ở `local_cv_segmenter.py` (bỏ mặt nạ LỚN chứa trọn mặt nạ NHỎ hơn đáng kể — giữ đơn vị đếm được, bỏ khung gộp) và `_anh_da_ap_mat_na` ở `local_cv_labeler.py` (tô nền phẳng NGOÀI mặt nạ đã nở thêm một dải nhỏ, trước khi đưa vùng cắt cho Florence-2 — giữ chút bối cảnh sát vật thể, cắt phần nền ở xa) | Quan sát thật từ đợt chạy thử 09/11 (`golden/images/g043.jpg`, 37 mặt nạ → 11 dòng `bom.flowers` sau khi gộp theo nhãn nguyên văn, nhiều dòng nội dung chồng lấp) và từ `KG-20260904-004-1` (ảnh thật qua `/tai-anh`, chủ sản phẩm chụp màn hình báo lại): nhiều dòng `bom.flowers` mô tả rõ ràng KHÔNG phải hoa/lá gì cả — "a person holding a white plate with a wreath on it", "a close up of a person's arm with a bandage on it", "a close up of a white sheet on a table/bed", "a close up of a body of water with a boat in the background". `_nhom_theo_nhan` gộp theo NHÃN Y HỆT, không gộp theo ngữ nghĩa — hai lượt giảm nhẹ trên là bước LỌC/CẮT ẢNH ĐẦU VÀO cho Florence-2, không phải bộ phân loại thị giác nên không chặn được caption sai hoàn toàn, chỉ giảm bớt cơ hội mô tả sai. Hai tham số mới (`sam2_nguong_chua_toi_thieu`/`sam2_ty_le_lon_hon_toi_thieu` trong `config.json`) lọc theo KHUNG BAO chứ không phải đúng đa giác mặt nạ — có thể lầm ở cụm hoa dày; `florence2_no_mat_na_ty_le` có RỦI RO đi kèm đã ghi rõ trong docstring `local_cv_labeler.py`: tô nền phẳng có thể làm caption XẤU ĐI với ảnh mà bối cảnh xung quanh thật sự giúp mô hình nhận diện (ví dụ một bó hoa cầm trên tay, mất bàn tay cầm khỏi khung có thể khiến mô hình khó đoán tỷ lệ/góc nhìn hơn) | CHƯA đo trên bộ ảnh vàng (nợ #24) — ba tham số mới đều có mặc định HỢP LÝ (0.85 / 1.5 / 0.15), KHÔNG phải số đã đo, đúng D5-c. Trả HẾT khi có bộ phân loại thị giác thật (cùng chỗ nghẽn với nợ #56) VÀ khi có ảnh thật để đo ba tham số này có làm giảm đúng loại lỗi đã thấy hay không, hay lại cắt mất bối cảnh cần thiết ở ca khác |
| 61 | `VISION_ENGINE_MAC_DINH`/`registry.MAC_DINH` đổi thành `local_cv` (D5-e, 09/11) mà chưa có phép đo trên bộ ảnh vàng — ghi đè có chủ đích, không phải kết quả thắng đo được | Chốt với chủ sản phẩm qua AskUserQuestion, có cảnh báo rõ đây là ghi đè D5-d. Tại thời điểm đổi chưa có worker thật nào đang xử lý job nên chưa job nào lỗi ngay; nhưng worker đầu tiên bật lên phục vụ job thật BẮT BUỘC phải có `torch`, `transformers==5.15.1`, `sam2` cùng hai tệp trọng số SAM2 (`sam2.1_hiera_small.pt`) và Florence-2 (`florence-community/Florence-2-base`) trong đúng môi trường thực thi — thiếu một trong số này thì `registry.lay_provider` ném `NotImplementedError` cho MỌI job không tự chọn bộ máy khác qua `H4` | **Đã đổi 09/12 — `local_cv` → `openai_direct`.** Ma trận 4 ảnh (g001, g002, g010, g011): local_cv (conf 55, đếm 5), openai_structured (conf 85–90, đếm 25–80), openai_direct (conf 90–95, đếm 16–60) — nhanh nhất (1 lượt, ~600 token prompt), rẻ nhất (gpt-4o-mini: 0,15/0,6 USD vào/ra vs gpt-4o: 2,5/10). `MODEL_MAC_DINH` `gpt-4o` → `gpt-4o-mini`. Bug config key `model_truc_tiep` → `model_tien_kiem` đã sửa. Còn đo chi tiết trên bộ ảnh vàng (nợ #24, luật mới: chỉ cần 8 ảnh) để xác nhận chính xác tuyệt đối |

Ghi ngày 09/11 (chủ sản phẩm phản hồi ảnh thật `KG-20260904-004-1` qua `/tai-anh`):

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 62 | `_dong_hoa`/`_dong_la` không khớp được danh mục thì `name` hiển thị đổi từ nguyên nhãn thô tiếng Anh sang một hằng số tiếng Việt cố định `TEN_CHUA_XAC_DINH` ("Chưa xác định được tên giống") — MẤT thông tin so với trước với đúng những ca Florence-2 mô tả ĐÚNG một loài hoa có thật nhưng loài đó không có alias tiếng Anh trong danh mục 86 loài (khoảng 15/86, xem `species_catalog.json`) | Chủ sản phẩm yêu cầu kết quả hiển thị tiếng Việt (09/11). Dịch máy một câu tiếng Anh bất kỳ sang tiếng Việt cần thêm một bước suy luận không kiểm chứng được ở đây — bịa một bản dịch nghe hợp lý còn tệ hơn nói thẳng "chưa biết", vì người soát có thể tưởng đó là điều mô hình THỊ GIÁC thật sự thấy chứ không phải máy dịch đoán. Nhãn gốc tiếng Anh KHÔNG mất — `dau_hieu_nhan_dang` giờ LUÔN mang nhãn gốc (trước bản này chỉ giữ khi CÓ khớp danh mục), và `/tai-anh` hiển thị nó thành một dòng phụ mờ "Mô hình mô tả: …" dưới tên chính để người soát còn manh mối sửa tay | Khi có nhu cầu thật: một bộ từ điển Anh–Việt riêng cho từ vựng hoa/lá phổ biến (không chỉ 86 loài trong danh mục cửa hàng) sẽ trả lại phần thông tin đã mất mà không cần dịch máy tự do — nhưng đó là một hạng mục riêng, cần chủ sản phẩm xác nhận có đáng làm không trước, vì độ phủ thật phụ thuộc vào nợ #60 (bớt nhãn nhầm nền) đã giảm được tới đâu |

Ghi ngày 09/11 (phạm vi sản phẩm mở rộng sang bộ tính năng hoàn chỉnh — D8 đến D12):

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 63 | **ĐÃ TRẢ 09/12 — bảng `occasions` đặc tả ở tài liệu 07 mục 9**, sáu dòng nạp sẵn `is_seed`, `archived_at` thay xoá cứng. Còn lại đúng một việc khi code P14: chuyển cột `Dịp` dạng chuỗi tự do của 1.316 dòng AVI GIFT trong `products.attributes.catalog` sang mã trong bảng, và chuỗi nào không khớp thì để trống cho người soát chứ không đoán. Nội dung nợ gốc giữ lại dưới đây làm hồ sơ: danh mục dịp sử dụng (20/10, Valentine, 8/3, Ngày của Mẹ, khai trương, hoa cưới, dịp riêng của tổ chức) chưa có bảng lẫn cột. M01b sinh `dip_su_dung`, M05 dựng trang chiến dịch theo dịp, M06 lọc catalog theo dịp, M09 nhắc mua theo dịp — bốn module đọc nó, nên nó là entity của core theo luật cắt | Bốn module đó đều chưa xây. Trong dữ liệu AVI GIFT đã nạp, cột `Dịp` nằm ở `products.attributes.catalog` dạng chuỗi tự do — đủ để không mất dữ liệu, chưa đủ để lọc | P14 — cùng pha với M01b, vì đó là chỗ đầu tiên máy ghi vào trường này |
| 64 | Mức trừ credit cho `creative.compose`, `video.generate`, `content.generate` chưa có. D7 chốt ba bộ máy Vision thu cùng một mức, nhưng một lượt video chênh hai bậc so với một ảnh nên không mở rộng D7 sang được | Chốt bảng giá trước khi có lượt chạy thật nào là đặt một con số kinh doanh không có căn cứ — cùng lý do nợ #14 và #58 | D14, chặn go-live của P16, P17, P18. Trong lúc chờ, hạn mức dùng thử không mở ba chức năng này |
| 65 | Lớp dữ liệu cá nhân của khách hàng cuối chưa có cơ sở pháp lý và chưa có luồng xoá theo yêu cầu của chính khách hàng. Lược đồ đã đỡ sẵn (`customer_consents` chèn-chỉ, đặc tả 07 mục 11) | Dựng lược đồ trước và mở luồng sau là thứ tự đúng: lược đồ không thu thập dữ liệu, còn một màn nhập khách hàng thì có | D13, chặn go-live của M09 và M10, không chặn việc viết mã |
| 66 | Số liệu kế thừa: 45 bài đăng và chỉ số lịch sử của thương hiệu gốc đã gán cho AVI GIFT theo quyết định Đ3-3, nên chúng sẽ tính vào số của AVI GIFT | Chấp nhận khi chốt Đ3-3. `campaign_rollups.is_legacy` là chỗ giữ mốc, và `YC-L5` buộc mọi báo cáo phân biệt trước và sau mốc | P20 — khi M11 dựng báo cáo đầu tiên, xác nhận mốc hiển thị đúng |
| 67 | `campaign_rollups` là bộ nhớ đệm dựng lại được, nhưng chưa có việc dựng lại nào — không script nào nạp lại từ `SocialFlow` khi bảng bị xoá hay lệch | Bảng chưa tồn tại. Ghi ra đây để khi dựng nó thì dựng luôn đường nạp lại, chứ không để nó âm thầm thành nguồn sự thật thứ hai | P20 |

Ghi ngày 09/12 (nền AI — cổng, sổ đăng ký, định tuyến, chấm điểm; D15 đến D19):

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 68 | Sổ đăng ký mô hình hiện là một tệp mã (`registry._dung_local_cv`), không phải bảng. Bật tắt một mô hình phải sửa mã và triển khai lại; bốn ô giấy phép không có chỗ để lưu | Ba adapter và một năng lực thì một tệp mã vẫn quản được. Nó hết quản được ở P16, khi loại nhà cung cấp thứ hai xuất hiện ở một repo khác | AI-1 |
| 69 | Lời gọi mô hình không mang mức quyền riêng tư, nên sàn quyền riêng tư chưa được cưỡng chế ở đâu. Hiện chỉ có một sự thật gián tiếp: `local_cv` không gửi ảnh ra ngoài, và màn `/bo-may` nói rõ bộ nào gửi ảnh đi | Với một năng lực và một loại dữ liệu (ảnh sản phẩm) thì lựa chọn ở cấp tổ chức là đủ. Nó hết đủ ở P21, khi dữ liệu cá nhân của khách hàng cuối vào hệ thống | AI-1, và bắt buộc trước P21 |
| 70 | Không có chuỗi dự phòng. `registry.lay_provider` ném `NotImplementedError` cho MỌI job khi môi trường worker thiếu trọng số — mặc định nền tảng hiện là `local_cv` (nợ #61), nên một môi trường worker thiếu `torch` hoặc thiếu tệp trọng số làm mọi lượt phân tích hỏng chứ không rơi về `openai_structured` | Tại thời điểm đổi mặc định chưa có worker thật nào đang chạy. Đây là nợ #61 nhìn từ phía kiến trúc: thứ còn thiếu không phải một bản sửa lỗi mà là một chuỗi dự phòng | AI-2 |
| 71 | Không có số đo theo mô hình: chi phí ghi theo `feature` (credit) và theo asset (USD), không theo lời gọi. Không độ trễ, không giây GPU, không điểm chất lượng — nên câu hỏi "mô hình nào đang đắt hơn giá trị nó tạo ra" không trả lời được | Với một mức credit cho cả ba bộ máy (D7) thì số đo theo mô hình chưa đổi được quyết định nào. Nó thành cần thiết ở D14, khi bảng giá phải phân biệt biến thể ảnh, video và nội dung | AI-1 |
| 72 | Ngưỡng chấp nhận chỉ có cho Identity Guard (0,95 và 0,90, đã chốt với chủ sản phẩm). Các năng lực còn lại chưa có ngưỡng, và `local_cv` đang trần `confidence` ở 55 vì chưa có bộ phân loại | Không có dữ liệu có đáp án thì một ngưỡng là một con số trông hợp lý, và một con số trông hợp lý nằm trong mã lâu hơn bất kỳ giả định nào khác | D20, cùng chỗ nghẽn với bộ ảnh vàng (nợ #24) |
| 73 | Danh mục loài chưa là bảng: `species_catalog.json` 86 loài so **chữ** với nhãn mô hình, không nhìn lại ảnh, và 63 cặp dễ nhầm chưa dùng tới. Chưa có vector, nên không truy hồi được theo nghĩa | Đây là nợ #56 nhìn từ phía tri thức. Chuyển sang bảng mà vẫn so chữ thì không thêm giá trị nào; nó chỉ đáng làm cùng lượt bật `pgvector` và nạp cặp dễ nhầm | AI-3 |
| 74 | Không có sự kiện miền. `job_events` là nhật ký một job, `audit_logs` là nhật ký hành động người — không cái nào cho một module đăng ký nghe việc của module khác, nên chuỗi giá trị hiện nối bằng lời gọi trực tiếp và bằng gợi ý trên giao diện | Với ba module lõi thì nối trực tiếp còn đọc được. Nó hết đọc được khi một lượt duyệt ảnh phải mở đường cho biến thể, video, nội dung và catalog cùng lúc | AI-4 |
| 75 | Giấy phép của thành phần không phải mô hình chưa soát: cấu hình build FFmpeg chưa khoá danh sách thành phần, dù bản cơ bản và các thành phần tuỳ chọn không cùng điều kiện giấy phép | Chưa có đường dựng video nào chạy thật. Soát trước khi có mã dùng nó thì không có gì để soát | Trước dòng mã FFmpeg đầu tiên của P17 |
