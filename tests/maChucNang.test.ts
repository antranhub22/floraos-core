/* Bộ mã chức năng và ba lớp cắt quyền. */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BA_VAI, CHUC_NANG, MOI_MA, THU_TU_NHOM, bangMacDinh, congTacDoiDuoc, duocPhep,
  khai, lamSachBang, laMaChucNang, soBang, vaiDuocPhep,
} from '../src/lib/maChucNang.ts'

test('mọi mã đều có tên, nhóm và bản mặc định', () => {
  MOI_MA.forEach((ma) => {
    const k = khai(ma)
    assert.ok(k.ten, `${ma} thiếu tên`)
    assert.ok(k.nhom, `${ma} thiếu nhóm`)
    assert.ok(Array.isArray(k.macDinh), `${ma} thiếu bản mặc định`)
    k.macDinh.forEach((v) => assert.ok(BA_VAI.includes(v), `${ma} có vai lạ: ${v}`))
  })
})

test('mọi nhóm đều nằm trong thứ tự vẽ', () => {
  const nhom = new Set(MOI_MA.map((ma) => khai(ma).nhom))
  nhom.forEach((n) => assert.ok(THU_TU_NHOM.includes(n), `nhóm chưa xếp thứ tự: ${n}`))
})

test('bản mặc định không vượt trần cứng của chính nó', () => {
  MOI_MA.forEach((ma) => {
    const k = khai(ma)
    if (!k.tranCung) return
    k.macDinh.forEach((v) => assert.ok(k.tranCung!.includes(v),
      `${ma}: mặc định cho ${v} nhưng trần cứng không có`))
  })
})

test('nhận đúng mã, từ chối mã lạ', () => {
  assert.ok(laMaChucNang('B6'))
  assert.ok(!laMaChucNang('B99'))
  assert.ok(!laMaChucNang(''))
  assert.ok(!laMaChucNang(null))
})

test('không có bảng thì lấy bản mặc định', () => {
  assert.deepEqual(vaiDuocPhep('B6', null), ['ADMIN'])
  assert.deepEqual(vaiDuocPhep('C1', null), ['ADMIN', 'COORDINATOR', 'SALES'])
})

test('bảng công tắc đè lên bản mặc định', () => {
  assert.deepEqual(vaiDuocPhep('B6', { B6: ['ADMIN', 'COORDINATOR'] }), ['ADMIN', 'COORDINATOR'])
  // Tắt hết mọi vai thì rơi về bản mặc định, không thành chức năng chết.
  assert.deepEqual(vaiDuocPhep('D14', { D14: [] }), ['ADMIN', 'COORDINATOR'])
})

test('trần cứng cắt sau cấu hình — bật E4 cho Sales cũng không mở được', () => {
  assert.deepEqual(vaiDuocPhep('E4', { E4: ['ADMIN', 'COORDINATOR', 'SALES'] }), ['ADMIN'])
  assert.equal(duocPhep('SALES', 'E4', { E4: ['SALES'] }), false)
  assert.equal(duocPhep('COORDINATOR', 'C10', { C10: ['COORDINATOR'] }), false)
  assert.equal(duocPhep('SALES', 'A3', { A3: ['SALES'] }), false)
})

test('chức năng luôn bật không nhận cấu hình', () => {
  assert.deepEqual(vaiDuocPhep('A1', { A1: [] }), ['ADMIN', 'COORDINATOR', 'SALES'])
  assert.deepEqual(vaiDuocPhep('A2', { A2: ['ADMIN'] }), ['ADMIN', 'COORDINATOR', 'SALES'])
})

test('vai lạ trong cấu hình bị bỏ, không làm hỏng cả dòng', () => {
  assert.deepEqual(vaiDuocPhep('B6', { B6: ['ADMIN', 'GIAM_DOC', 123] as any }), ['ADMIN'])
})

test('thứ tự vai trong kết quả luôn cố định', () => {
  assert.deepEqual(vaiDuocPhep('B5', { B5: ['SALES', 'ADMIN', 'COORDINATOR'] }),
    ['ADMIN', 'COORDINATOR', 'SALES'])
})

test('làm sạch bảng: bỏ mã lạ, bỏ mục không đổi được, ép qua trần', () => {
  const sach = lamSachBang({
    B6: ['ADMIN', 'SALES'],
    E4: ['SALES'],
    A1: [],
    KHONG_CO_MA_NAY: ['ADMIN'],
    D14: 'không phải mảng',
  })
  assert.deepEqual(sach.B6, ['ADMIN', 'SALES'])
  assert.deepEqual(sach.E4, ['ADMIN'], 'trần cứng ép về ADMIN, không để trống')
  assert.ok(!('A1' in sach), 'mục luôn bật không vào bảng')
  assert.ok(!('KHONG_CO_MA_NAY' in sach))
  assert.ok(!('D14' in sach), 'giá trị không phải mảng bị bỏ')
})

test('bảng mặc định phủ đủ mọi mã', () => {
  const b = bangMacDinh()
  assert.equal(Object.keys(b).length, MOI_MA.length)
  MOI_MA.forEach((ma) => assert.deepEqual(b[ma], [...khai(ma).macDinh]))
})

test('công tắc nào đổi được', () => {
  assert.equal(congTacDoiDuoc('A1', 'ADMIN'), false, 'luôn bật')
  assert.equal(congTacDoiDuoc('E4', 'SALES'), false, 'trần cứng')
  assert.equal(congTacDoiDuoc('E4', 'ADMIN'), true)
  assert.equal(congTacDoiDuoc('B6', 'SALES'), true)
})

test('cấu hình cắt sạch mọi vai thì rơi về mặc định, không khoá chết', () => {
  assert.deepEqual(vaiDuocPhep('E4', { E4: [] }), ['ADMIN'])
  assert.deepEqual(vaiDuocPhep('E4', { E4: ['SALES'] }), ['ADMIN'])
  assert.deepEqual(vaiDuocPhep('B6', { B6: [] }), ['ADMIN'])
})

test('so bảng nêu đúng chỗ đổi', () => {
  const doi = soBang(null, { ...bangMacDinh(), B6: ['ADMIN', 'COORDINATOR'] })
  assert.equal(doi.length, 1)
  assert.equal(doi[0].ma, 'B6')
  assert.deepEqual(doi[0].truoc, ['ADMIN'])
  assert.deepEqual(doi[0].sau, ['ADMIN', 'COORDINATOR'])
})

test('so bảng không báo đổi khi bảng y hệt', () => {
  assert.deepEqual(soBang(bangMacDinh(), bangMacDinh()), [])
})

test('mã trong tài liệu phân quyền đều có mặt', () => {
  const phaiCo = ['A7', 'B8', 'C10', 'C14', 'D10', 'E4', 'F6', 'G2', 'H1', 'H5', 'I2', 'I5']
  phaiCo.forEach((ma) => assert.ok(laMaChucNang(ma), `thiếu mã ${ma}`))
  assert.equal(Object.keys(CHUC_NANG).length, MOI_MA.length)
})

test('vai Sales chỉ giữ đúng những mã có đường đi trong màn Sales Hub', () => {
  const cua = MOI_MA.filter((ma) => duocPhep('SALES', ma, null))
  assert.deepEqual(cua, ['A1', 'A2', 'C1', 'C2', 'C17', 'C24', 'C25', 'C26', 'E2', 'F2'],
    'cấp thêm mã cho Sales mà không dựng đường đi thì bảng quyền nói khác màn hình')
})

test('giá Đối tác Shop không mở được cho người bán', () => {
  assert.equal(duocPhep('SALES', 'C27', null), false, 'bản mặc định đã cắt')
  assert.equal(duocPhep('SALES', 'C27', { C27: ['ADMIN', 'COORDINATOR', 'SALES'] }), false,
    'trần cứng phải cắt sau bảng công tắc, không có đường mở từ cấu hình')
  assert.equal(congTacDoiDuoc('C27', 'SALES'), false, 'công tắc của vai Sales không hiện trên bảng')
})

test('ảnh tư vấn tách khỏi ảnh dựng thẻ', () => {
  assert.equal(duocPhep('SALES', 'C17', null), true, 'Sales copy được ảnh gửi khách')
  assert.equal(duocPhep('SALES', 'C4', null), false, 'nhưng không nạp được dữ liệu vào biểu mẫu thẻ')
})

test('định mức tiền công chỉ Điều hành sửa, bảng công tắc không mở thêm được', () => {
  assert.deepEqual(vaiDuocPhep('D16', { D16: ['ADMIN', 'COORDINATOR', 'SALES'] }), ['ADMIN'])
})

test('bốn việc của khối bắn đơn có mã riêng, không đi ké mã mở tab', () => {
  ;['C18', 'C19', 'C20', 'C21', 'C22', 'C23'].forEach((ma) => {
    assert.ok(laMaChucNang(ma), `thiếu mã ${ma}`)
    assert.deepEqual(vaiDuocPhep(ma as any, null), ['ADMIN', 'COORDINATOR'],
      `${ma} phải mở cho Điều hành và Điều phối, không mở cho Sales`)
  })
})

test('tắt quyền bắn đơn không tắt luôn quyền đọc lịch sử', () => {
  const bang = { C19: ['ADMIN'] }
  assert.equal(duocPhep('COORDINATOR', 'C19', bang), false)
  assert.equal(duocPhep('COORDINATOR', 'C18', bang), true)
})

test('vai Điều phối giữ đủ mã của một ca điều phối', () => {
  const phaiCo = [
    'C3', 'C4', 'C11', 'C12', 'C14', 'C15', 'C16',
    'C18', 'C19', 'C20', 'C21', 'C22', 'C23',
    'D1', 'D2', 'D14', 'D15', 'F3', 'F4', 'G1', 'G4', 'I1', 'I4',
  ]
  phaiCo.forEach((ma) => assert.equal(duocPhep('COORDINATOR', ma as any, null), true,
    `Điều phối phải có ${ma}`))
})

test('giá dưới Sàn vẫn là trần cứng ở vai Điều hành', () => {
  assert.deepEqual(vaiDuocPhep('C10', { C10: ['ADMIN', 'COORDINATOR'] }), ['ADMIN'])
})
