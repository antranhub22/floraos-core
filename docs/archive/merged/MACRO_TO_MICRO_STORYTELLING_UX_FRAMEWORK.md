> [!NOTE]
> **Framework UX cấp nền tảng, áp dụng cho mọi page trong webapp `floraos-core`** (xem mục 32 — Phạm vi áp dụng). Đây là tài liệu tham chiếu chính cho nguyên tắc trải nghiệm nói ở `docs/dac-ta/03-ux-architecture.md`. Nạp vào `docs/kien-truc/` ngày 19/09/2026.

# Macro-to-Micro Storytelling UX Framework

## 1. Mục đích

Đây là framework UI/UX tổng quát dành cho **mọi page trong webapp**, không phụ thuộc vào ngành, chức năng hay loại dữ liệu.

Mục tiêu là tạo ra trải nghiệm:

- Dễ hiểu ngay từ lần đầu sử dụng
- Có cấu trúc rõ ràng
- Không quá tải thông tin
- Cho phép người dùng nhìn thấy toàn cảnh trước
- Cho phép người dùng tự chọn vấn đề muốn quan tâm
- Chỉ đi sâu khi người dùng có chủ đích
- Dẫn dắt người dùng qua thông tin theo một câu chuyện logic
- Kết thúc bằng một hành động rõ ràng khi phù hợp

### Triết lý cốt lõi

> **Give users the map. Let them choose the path. Tell the story one layer at a time. End with a meaningful action.**

Tiếng Việt:

> **Cho người dùng thấy bản đồ trước → để họ tự chọn hướng đi → dẫn dắt họ đi sâu từng lớp → kết thúc bằng một hành động có ý nghĩa.**

---

# 2. Tên Framework

## Macro-to-Micro Storytelling UX

Framework kết hợp hai tư duy:

### Macro-to-Micro

Người dùng luôn được cung cấp **bối cảnh và toàn cảnh trước**, sau đó mới đi vào chi tiết.

### Progressive Storytelling

Sau khi người dùng chọn một vấn đề cụ thể, hệ thống **tiết lộ thông tin từng lớp theo một trình tự logic**, thay vì hiển thị toàn bộ cùng lúc.

### Công thức tổng quát

```text
SEE
  ↓
SELECT
  ↓
UNDERSTAND
  ↓
DECIDE
  ↓
ACT
```

Hoặc:

```text
MACRO
  ↓
USER CHOICE
  ↓
MICRO STORY
  ↓
ACTION
```

---

# 3. Nguyên tắc nền tảng

## Principle 01 — Macro Before Micro

> **Always establish context before presenting depth.**

Người dùng cần biết:

- Tôi đang ở đâu?
- Page này dùng để làm gì?
- Có những nhóm thông tin nào?
- Điều gì đang đáng chú ý?
- Tôi có thể đi sâu vào đâu?

Không bắt người dùng đi qua nhiều lớp chỉ để hiểu page đang có những gì.

### Nguyên tắc

**Breadth first, depth later.**

---

# 4. Principle 02 — User Chooses the Path

Hệ thống nên cung cấp các hướng khám phá có ý nghĩa, nhưng **người dùng quyết định họ muốn đi theo hướng nào**.

Ví dụ:

```text
Overview
├── Area A
├── Area B
├── Area C
└── Area D
```

Người dùng chọn một area:

```text
Area B
```

Sau đó hệ thống mới chuyển sang trải nghiệm chi tiết của Area B.

### Không nên

Tự động ép người dùng đi qua một flow dài khi họ chưa thể hiện ý định.

### Nên

> **Present meaningful paths. Let users choose.**

---

# 5. Principle 03 — Progressive Storytelling

Progressive Storytelling chỉ nên được áp dụng mạnh **sau khi người dùng đã chọn một vấn đề hoặc đối tượng cụ thể**.

Khi đó, thông tin được mở dần theo logic:

```text
WHAT
  ↓
WHY
  ↓
WHO / HOW
  ↓
SO WHAT
  ↓
WHAT NEXT
```

### Ví dụ tổng quát

```text
WHAT
Điều gì đang xảy ra?

↓
WHY
Tại sao điều đó xảy ra?

↓
WHO / HOW
Điều này liên quan đến ai / diễn ra như thế nào?

↓
SO WHAT
Điều đó có ý nghĩa gì?

↓
WHAT NEXT
Bước tiếp theo có thể là gì?
```

Không phải mọi page đều cần đủ 5 lớp. Chỉ sử dụng những lớp phù hợp với mục đích của page.

---

# 6. Principle 04 — User Controls Depth

> **The user controls how deep they want to go.**

Không phải mọi người dùng đều cần cùng một mức độ thông tin.

Một người có thể:

```text
Overview
  ↓
Item
  ↓
Done
```

Người khác có thể:

```text
Overview
  ↓
Item
  ↓
Why
  ↓
Evidence
  ↓
Implication
  ↓
Recommendation
  ↓
Action
```

Thiết kế phải cho phép cả hai hành vi.

### Quy tắc

Thông tin sâu:

- Có thể truy cập
- Dễ tìm
- Không gây cản trở
- Không bắt buộc phải đọc

> **Available, but not imposed.**

---

# 7. Principle 05 — Insight Before Data

Đặc biệt với các page chứa dữ liệu, analytics hoặc AI:

Không nên bắt người dùng tự đọc dữ liệu rồi tự suy luận ý nghĩa.

Thứ tự ưu tiên:

```text
DATA
  ↓
INSIGHT
  ↓
MEANING
  ↓
ACTION
```

Trong UI nên ưu tiên:

```text
Điều đáng chú ý
↓
Tại sao đáng chú ý
↓
Dữ liệu chứng minh
↓
Có thể làm gì tiếp
```

### Ví dụ cấu trúc

```text
KEY INSIGHT

Một chỉ số đang tăng đáng kể.

WHY?
3 nguyên nhân chính...

EVIDENCE
[Data / Chart / Source]

NEXT
[ Xem cơ hội ]
```

---

# 8. Principle 06 — One Clear Next Step

Mỗi trạng thái quan trọng của giao diện nên có **một hành động tiếp theo rõ ràng**.

Không tạo quá nhiều CTA có cùng mức độ ưu tiên.

### Không nên

```text
[View]
[Edit]
[Analyze]
[Create]
[Compare]
[Export]
[Share]
```

### Nên

```text
Insight

...

[ Xem chi tiết ]
```

Các hành động phụ có thể đặt ở secondary actions hoặc overflow menu.

### Quy tắc CTA

CTA phải trả lời được:

> **"Sau khi click, tôi sẽ nhận được gì?"**

Vì vậy ưu tiên:

- Xem nguyên nhân
- Xem chi tiết
- Xem cơ hội
- So sánh
- Tạo nội dung
- Chỉnh sửa
- Tiếp tục

hơn các CTA mơ hồ như:

- Continue
- View
- More
- Next

---

# 9. Principle 07 — Complexity Follows Intent

> **UI complexity should increase only when user intent becomes more specific.**

Khi người dùng chưa biết mình muốn gì:

```text
Simple
  ↓
Overview
```

Khi người dùng chọn một vấn đề:

```text
More detail
  ↓
Micro exploration
```

Khi người dùng yêu cầu phân tích sâu:

```text
High detail
  ↓
Evidence / Data / Configuration
```

Sau khi hoàn tất quyết định:

```text
Simple again
  ↓
Action
```

### Mô hình

```text
LOW COMPLEXITY
       ↓
     MACRO
       ↓
    SELECT
       ↓
   MICRO STORY
       ↓
 DEEP ANALYSIS
       ↓
     ACTION
       ↓
LOW COMPLEXITY
```

---

# 10. Cấu trúc 4 tầng của mọi Page

Mọi page nên được đánh giá theo 4 tầng sau.

## Layer 01 — MACRO

### Mục tiêu

Cho người dùng **bản đồ của page**.

Cần trả lời:

- Page này là gì?
- Mục đích là gì?
- Có những nhóm thông tin nào?
- Điều gì đáng chú ý?
- Có những hướng khám phá nào?

### UI thường dùng

- Overview
- Summary
- Key metrics
- Categories
- Status
- Highlights
- Alerts
- Recent activity
- Opportunities

---

## Layer 02 — SELECT

### Mục tiêu

Cho người dùng chọn thứ họ muốn tìm hiểu hoặc xử lý.

Có thể là:

- Category
- Item
- Record
- Trend
- Product
- Customer
- Campaign
- Project
- Issue
- Insight
- Asset

### Nguyên tắc

> **The system provides the map. The user chooses the destination.**

---

## Layer 03 — MICRO STORY

### Mục tiêu

Giúp người dùng hiểu sâu vấn đề đã chọn.

Có thể sử dụng:

```text
WHAT
WHY
WHO
HOW
SO WHAT
EVIDENCE
WHAT NEXT
```

Không nhất thiết phải dùng toàn bộ.

Chọn đúng các lớp phù hợp với context.

---

## Layer 04 — ACTION

### Mục tiêu

Chuyển understanding thành hành động khi phù hợp.

Ví dụ:

- Create
- Edit
- Approve
- Publish
- Schedule
- Compare
- Analyze
- Generate
- Save
- Share
- Resolve
- Configure

Nếu page chỉ có mục đích tham khảo, không cần ép phải có action.

---

# 11. Information Hierarchy

Mọi page nên tổ chức thông tin theo thứ tự:

## Level 1 — Answer

> Điều quan trọng nhất là gì?

## Level 2 — Context

> Điều này xảy ra trong bối cảnh nào?

## Level 3 — Explanation

> Tại sao / như thế nào?

## Level 4 — Evidence

> Dữ liệu hoặc bằng chứng nào hỗ trợ?

## Level 5 — Detail

> Những thông tin chuyên sâu nào cần thiết?

## Level 6 — Action

> Có thể làm gì tiếp theo?

Không phải page nào cũng cần tất cả 6 level.

---

# 12. Macro Layer — Quy tắc thiết kế

Macro không phải là một dashboard chứa càng nhiều dữ liệu càng tốt.

Macro là **bản đồ nhận thức**.

Người dùng nên có khả năng scan nhanh và hiểu:

```text
WHERE AM I?
WHAT IS HERE?
WHAT MATTERS?
WHERE CAN I GO?
```

### Macro nên ưu tiên

- Hierarchy rõ
- Whitespace
- Ít nhóm chính
- Headline dễ hiểu
- Summary ngắn
- Visual distinction giữa các khu vực
- Các entry point rõ ràng

### Macro không nên

- Quá nhiều KPI
- Quá nhiều chart
- Quá nhiều filter
- Quá nhiều card
- Hiển thị toàn bộ database
- Bắt người dùng đọc trước khi hiểu cấu trúc

---

# 13. Micro Layer — Quy tắc thiết kế

Khi user đã chọn một vấn đề:

### 1. Giữ context

Luôn cho biết:

```text
Tôi đang ở đâu?
Tôi đã chọn gì?
Tôi đang xem lớp thông tin nào?
```

### 2. Dẫn dắt theo logic

```text
WHAT
→ WHY
→ SO WHAT
→ WHAT NEXT
```

### 3. Ẩn thông tin phụ

Dùng:

- Accordion
- Expand / Collapse
- Tabs khi thực sự cần
- Drawer
- Modal cho context ngắn
- Detail section
- "Show more"
- Evidence on demand

### 4. Không tạo cảm giác bị giấu thông tin

Người dùng phải biết thông tin sâu hơn tồn tại.

Ví dụ:

```text
WHY THIS MATTERS
[ Xem phân tích ]
```

thay vì hoàn toàn không cho biết có phân tích.

---

# 14. Depth Control

Có thể định nghĩa depth theo 5 mức:

```text
D0 — Overview
D1 — Category / Object
D2 — Insight
D3 — Evidence / Detail
D4 — Action / Configuration
```

### Quy tắc

Người dùng có thể dừng ở bất kỳ depth nào.

Không nên thiết kế flow bắt buộc:

```text
D0 → D1 → D2 → D3 → D4
```

nếu mục tiêu của user chỉ cần:

```text
D0 → D1
```

---

# 15. Navigation Framework

Có hai lớp navigation.

## Global Navigation

Cho biết vị trí trong toàn bộ sản phẩm.

Ví dụ:

```text
Home
Products
Intelligence
Content
Creative
Publishing
Analytics
Settings
```

## Contextual Navigation

Cho biết vị trí trong journey hiện tại.

Ví dụ:

```text
Intelligence
 / Trends
 / Selected Trend
 / Opportunity
```

### Quy tắc

User luôn phải trả lời được:

> **Where am I?**

và:

> **How do I go back?**

---

# 16. Breadcrumb và Context

Breadcrumb phù hợp khi depth lớn:

```text
Area
 / Category
 / Item
 / Detail
```

Không dùng breadcrumb chỉ vì design system yêu cầu.

Nếu flow ngắn, một nút:

```text
← Back
```

có thể rõ ràng hơn.

---

# 17. Card Framework

Mỗi card phải có mục đích.

Một card nên phục vụ ít nhất một trong ba vai trò:

## INFORM

> Cho biết điều gì đang xảy ra.

## NAVIGATE

> Cho phép đi sâu vào một vấn đề.

## ACT

> Cho phép thực hiện hành động.

Nếu một card không rõ nó đang:

- Inform
- Navigate
- Act

thì cần xem xét loại bỏ.

---

# 18. AI UX Framework

Đối với các page có AI, nên chuyển từ:

> **Data Dump**

sang:

> **AI-guided Understanding**

AI nên trình bày:

```text
1. WHAT I FOUND
2. WHY IT MATTERS
3. WHAT IT MEANS FOR YOU
4. WHAT YOU CAN DO
```

Không nên chỉ đưa:

```text
Score
Probability
Metrics
Raw output
```

Dữ liệu vẫn cần thiết, nhưng nên đóng vai trò **evidence**, không phải toàn bộ câu chuyện.

---

# 19. AI Confidence và Evidence

Khi AI đưa ra insight có thể ảnh hưởng đến quyết định, nên cho phép user xem:

- Confidence
- Data freshness
- Source
- Evidence
- Methodology khi cần
- Limitations khi cần

Ví dụ:

```text
INSIGHT
...

Confidence: High
Updated: 2 hours ago

[ Xem dữ liệu ]
```

Thông tin kỹ thuật không cần chiếm vị trí trung tâm của UI.

---

# 20. Search và Filter

Search và filter là công cụ hỗ trợ navigation, không phải cách thay thế information architecture.

### Macro

Chỉ hiển thị filter quan trọng.

### Micro

Có thể cho phép filter sâu hơn nếu user đã xác định intent.

Không đưa 20 filter lên đầu page chỉ vì hệ thống có 20 field.

### Nguyên tắc

> **Filter complexity should follow user intent.**

---

# 21. Empty State

Empty state cũng phải tuân theo framework.

Không chỉ:

> No data.

Mà nên giải thích:

```text
WHAT
Chưa có dữ liệu.

WHY
Bạn chưa tạo...

WHAT NEXT
[ Tạo mới ]
```

---

# 22. Loading State

Loading state nên cho user biết hệ thống đang làm gì khi thời gian chờ đủ dài.

Ví dụ:

```text
Đang phân tích...

✓ Đã đọc dữ liệu
✓ Đang tìm pattern
○ Đang tạo insight
```

Không cần giả lập tiến trình nếu hệ thống không thực sự thực hiện các bước đó.

---

# 23. Error State

Error cũng phải có storytelling ngắn:

```text
WHAT
Không thể tải dữ liệu.

WHY
Kết nối tới nguồn dữ liệu bị gián đoạn.

WHAT NEXT
[ Thử lại ]
```

Không chỉ hiển thị technical error code.

---

# 24. Responsive UX

Responsive không có nghĩa là:

> Thu nhỏ desktop xuống mobile.

Logic Macro-to-Micro phải được giữ nguyên.

### Desktop

Có thể hiển thị nhiều context song song.

### Mobile

Có thể hiển thị tuần tự hơn.

Nhưng vẫn giữ:

```text
MACRO
↓
SELECT
↓
MICRO
↓
ACTION
```

---

# 25. Visual Complexity Framework

### Macro

Complexity thấp.

### Select

Complexity vừa phải.

### Micro

Complexity tăng theo intent.

### Deep Detail

Chỉ hiển thị khi cần.

### Action

Giảm complexity trở lại.

```text
Complexity
   │
   │              ┌───────┐
   │            ┌─┘       └─┐
   │         ┌──┘            └──
   │      ┌──┘
   │──────┘
   └────────────────────────────
       Macro → Micro → Action
```

Mục tiêu không phải là làm UI "đơn giản tuyệt đối".

Mục tiêu là:

> **Độ phức tạp phải tỷ lệ với mức độ quan tâm và ý định của người dùng.**

---

# 26. Anti-Patterns

## Anti-pattern 01 — Dashboard Overload

Mọi dữ liệu đều được đưa lên màn hình đầu tiên.

**Vấn đề:** User không biết nên nhìn gì.

---

## Anti-pattern 02 — Deep-first

Bắt user vào chi tiết trước khi biết toàn cảnh.

**Vấn đề:** Mất context.

---

## Anti-pattern 03 — Forced Wizard

Bắt user đi qua từng bước dù họ chỉ cần một phần thông tin.

**Vấn đề:** Mất quyền kiểm soát.

---

## Anti-pattern 04 — Hidden Intelligence

Ẩn quá nhiều thông tin khiến user không biết hệ thống có khả năng gì.

**Giải pháp:** Cho thấy summary hoặc entry point.

---

## Anti-pattern 05 — CTA Overload

Quá nhiều CTA cùng cấp độ.

**Vấn đề:** Không biết hành động nào quan trọng.

---

## Anti-pattern 06 — Data Before Meaning

Đưa chart và số liệu trước khi giải thích ý nghĩa.

**Vấn đề:** User phải tự phân tích.

---

## Anti-pattern 07 — Dead-end Page

User đọc xong nhưng không biết có thể làm gì tiếp.

**Giải pháp:** Cung cấp relevant next action khi phù hợp.

---

## Anti-pattern 08 — UI Complexity Without Intent

Hiển thị advanced controls khi user chưa cần.

**Giải pháp:** Progressive disclosure.

---

# 27. Page Design Checklist

Trước khi hoàn thành bất kỳ page nào, hãy kiểm tra:

### Context

- [ ] User biết mình đang ở đâu?
- [ ] User hiểu page dùng để làm gì?

### Macro

- [ ] User nhìn thấy toàn cảnh?
- [ ] Các nhóm thông tin chính rõ ràng?
- [ ] Có thể scan nhanh?

### Choice

- [ ] User có thể chọn thứ họ quan tâm?
- [ ] Các entry point có ý nghĩa?

### Micro

- [ ] Thông tin sâu chỉ xuất hiện khi cần?
- [ ] Có trình tự logic?
- [ ] User kiểm soát depth?

### Meaning

- [ ] Insight được giải thích trước hoặc cùng với data?
- [ ] User hiểu "So What?"

### Action

- [ ] Có next step rõ ràng khi cần?
- [ ] CTA chính nổi bật?
- [ ] Không có CTA overload?

### Navigation

- [ ] User biết mình đang ở đâu?
- [ ] Có cách quay lại rõ ràng?

### Complexity

- [ ] UI không phức tạp hơn mức intent cần thiết?
- [ ] Advanced information/control được progressive disclosure?

### States

- [ ] Loading?
- [ ] Empty?
- [ ] Error?
- [ ] Success?
- [ ] Stale data nếu có?

---

# 28. Design Review Questions

Khi review một thiết kế, không hỏi đơn giản:

> "UI có đẹp không?"

Hãy hỏi:

### 01
**User có nhìn thấy bản đồ trước không?**

### 02
**User có hiểu mình có thể đi đâu không?**

### 03
**User có quyền chọn hướng đi không?**

### 04
**Sau khi chọn, thông tin có được mở dần theo logic không?**

### 05
**Có thông tin nào đang được hiển thị quá sớm không?**

### 06
**Có thông tin quan trọng nào đang bị ẩn quá sâu không?**

### 07
**User có hiểu "So What?" không?**

### 08
**User có biết bước tiếp theo không?**

### 09
**Có quá nhiều lựa chọn cùng lúc không?**

### 10
**Độ phức tạp của UI có tương xứng với intent không?**

---

# 29. Design System Principles

Có thể đưa trực tiếp các nguyên tắc sau vào Design System:

### P01 — Macro Before Micro

> Establish context before depth.

### P02 — User Chooses the Path

> Present meaningful paths and let users decide where to explore.

### P03 — Progressive Storytelling

> Reveal deeper information progressively after the user selects a specific context.

### P04 — User Controls Depth

> Never force users through information they do not need.

### P05 — Insight Before Data

> Explain meaning before exposing complexity.

### P06 — One Clear Next Step

> Every meaningful state should have a clear next action when an action is relevant.

### P07 — Complexity Follows Intent

> Increase complexity only as user intent becomes more specific.

### P08 — Context Is Always Visible

> Users should always understand where they are and what they are exploring.

### P09 — Information Has a Job

> Every UI element must inform, navigate, explain, or enable action.

### P10 — Progressive, Not Hidden

> Secondary information may be deferred, but should remain discoverable.

---

# 30. Master Framework

```text
                    ┌─────────────────────┐
                    │       MACRO         │
                    │     SEE THE MAP     │
                    │                     │
                    │ What is here?       │
                    │ What matters?       │
                    │ Where can I go?     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       SELECT        │
                    │   CHOOSE A PATH     │
                    │                     │
                    │ What interests me?  │
                    │ What do I need?     │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │          MICRO STORY            │
              │                                │
              │ WHAT                            │
              │   ↓                            │
              │ WHY                             │
              │   ↓                            │
              │ WHO / HOW                       │
              │   ↓                            │
              │ SO WHAT                         │
              │   ↓                            │
              │ WHAT NEXT                       │
              └───────────────┬────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │       ACTION        │
                    │   ACT / CREATE      │
                    │                     │
                    │ Do / Save / Edit /  │
                    │ Publish / Continue  │
                    └──────────┬──────────┘
                               │
                               ▼
                         NEXT STATE
```

---

# 31. Golden Rule

> ### **Don't show everything. Don't hide everything.**
>
> **Show the map. Let users choose. Reveal the story progressively.**

Hoặc phiên bản ngắn nhất để dùng trong Design System:

> ### **SEE → SELECT → UNDERSTAND → ACT**

Và câu mô tả đầy đủ:

> **Every page should first establish the big picture, allow users to choose what matters to them, progressively reveal the depth of the selected context, and provide a meaningful next action when appropriate.**

---

# 32. Phạm vi áp dụng

Framework này có thể áp dụng cho:

- Dashboard
- Analytics
- Market Intelligence
- Product Management
- CRM
- Customer Management
- Content Management
- Creative Tools
- Project Management
- Operations
- Finance
- Reporting
- AI Assistants
- AI Agent interfaces
- Search results
- Settings
- Admin pages
- Workflow pages
- Detail pages
- SaaS applications nói chung

Framework **không quy định một layout cố định**.

Nó quy định **logic nhận thức và tương tác**.

Layout, component, navigation pattern và visual style có thể thay đổi tùy context, nhưng tư duy nền tảng vẫn giữ:

```text
MACRO
  ↓
CHOICE
  ↓
PROGRESSIVE DEPTH
  ↓
MEANING
  ↓
ACTION
```

---

# 33. Final Definition

## Macro-to-Micro Storytelling UX

> **Một framework thiết kế trong đó người dùng được cung cấp bức tranh tổng thể trước, tự lựa chọn vấn đề hoặc đối tượng họ quan tâm, sau đó được dẫn dắt qua các lớp thông tin ngày càng sâu theo một câu chuyện logic, với độ phức tạp tăng theo intent và kết thúc bằng hành động phù hợp.**

### Core Philosophy

> **The system provides the map.  
> The user chooses the path.  
> The interface tells the story.  
> The user controls the depth.  
> The product enables the action.**
