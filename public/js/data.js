/* Default data taken from port-fee-calculator-en.xlsx (Rate Table / Holiday List / Anchorage List) */
(function (root) {
  'use strict';

  // kind : 'loa' = LOA x rate x qty, 'flat' = rate x qty
  // unit : 'days' | 'apply' (1 when applied) | 'count' | 'hours'
  // auto : quantity derived from the date-times and categories
  var ITEMS = [
    { key: 'r1', no: '1', kind: 'loa', unit: 'days', auto: true, rate: 20,
      ko: '화물선 정박지 이용', en: 'Cargo vessel — anchorage use' },
    { key: 'r2', no: '2', kind: 'loa', unit: 'days', auto: true, rate: 7,
      ko: '어선 정박지 이용', en: 'Fishing vessel — anchorage use' },
    { key: 'r3a', no: '3a', kind: 'loa', unit: 'apply', auto: true, rate: 100,
      ko: '100m 초과 — 접안 당일 (평일)', en: 'Over 100 m — berthing day (weekday)' },
    { key: 'r3b', no: '3b', kind: 'loa', unit: 'apply', auto: true, rate: 110,
      ko: '100m 초과 — 접안 당일 (주말)', en: 'Over 100 m — berthing day (weekend)' },
    { key: 'r3c', no: '3c', kind: 'loa', unit: 'apply', auto: true, rate: 112,
      ko: '100m 초과 — 접안 당일 (공휴일)', en: 'Over 100 m — berthing day (holiday)' },
    { key: 'r4a', no: '4a', kind: 'loa', unit: 'apply', auto: true, rate: 55,
      ko: '50~100m — 접안 당일 (평일)', en: '50–100 m — berthing day (weekday)' },
    { key: 'r4b', no: '4b', kind: 'loa', unit: 'apply', auto: true, rate: 60,
      ko: '50~100m — 접안 당일 (주말)', en: '50–100 m — berthing day (weekend)' },
    { key: 'r4c', no: '4c', kind: 'loa', unit: 'apply', auto: true, rate: 62,
      ko: '50~100m — 접안 당일 (공휴일)', en: '50–100 m — berthing day (holiday)' },
    { key: 'r5a', no: '5a', kind: 'loa', unit: 'apply', auto: true, rate: 30,
      ko: '20~50m (도선·예인 없음) — 접안 당일 (평일)', en: '20–50 m, no pilot/tug — berthing day (weekday)' },
    { key: 'r5b', no: '5b', kind: 'loa', unit: 'apply', auto: true, rate: 35,
      ko: '20~50m (도선·예인 없음) — 접안 당일 (주말)', en: '20–50 m, no pilot/tug — berthing day (weekend)' },
    { key: 'r5c', no: '5c', kind: 'loa', unit: 'apply', auto: true, rate: 37,
      ko: '20~50m (도선·예인 없음) — 접안 당일 (공휴일)', en: '20–50 m, no pilot/tug — berthing day (holiday)' },
    { key: 'r6first', no: '6', kind: 'loa', unit: 'apply', auto: true, rate: 30,
      ko: '바지선 — 당일', en: 'Barge — first day' },
    { key: 'r6next', no: '6', kind: 'loa', unit: 'days', auto: true, rate: 20,
      ko: '바지선 — 둘째 날부터', en: 'Barge — from second day' },
    { key: 'r6emg', no: '6', kind: 'loa', unit: 'days', auto: false, rate: 7, tbc: true,
      ko: '바지선 — 비상·무작업 (제안 단계)', en: 'Barge — emergency / no work (proposed)',
      noteKo: '확인 필요: 제안 단계. $7가 LOA에 곱하는 요율인지 고정 금액인지 불명확하여 LOA × $7로 가정',
      noteEn: 'To be confirmed: proposal stage. Unclear whether $7 is multiplied by LOA or flat — LOA × $7 assumed' },
    { key: 'r7first', no: '7', kind: 'loa', unit: 'apply', auto: true, rate: 30,
      ko: '소형선박(20m 미만) — 당일', en: 'Small craft (<20 m) — first day' },
    { key: 'r7next', no: '7', kind: 'loa', unit: 'days', auto: true, rate: 20,
      ko: '소형선박(20m 미만) — 둘째 날부터', en: 'Small craft (<20 m) — from second day' },
    { key: 'r8', no: '8', kind: 'loa', unit: 'days', auto: false, rate: 6,
      ko: '정박지 24시간 이상 체류', en: 'Anchorage stay over 24 hours',
      noteKo: '예인선·아주 작은 소형 어선에 적용', noteEn: 'Applies to tugs and very small fishing vessels' },
    { key: 'r9', no: '9', kind: 'loa', unit: 'days', auto: true, rate: 20,
      ko: '접안 24시간 이상 체류 (둘째 날부터)', en: 'Alongside stay over 24 hours (from second day)' },
    { key: 'r10', no: '10', kind: 'loa', unit: 'days', auto: false, rate: 100,
      ko: '특수 하역시설 이용', en: 'Special loading facilities',
      noteKo: '예: 정박지 D2 등에서 작업하는 특수 선박', noteEn: 'E.g. submersible vessels working at D2' },
    { key: 'r11', no: '11', kind: 'loa', unit: 'days', auto: false, rate: 20,
      ko: 'Kissy Oil Jetty 추가 체류', en: 'Kissy Oil Jetty — additional stay',
      noteKo: '9번과 같은 요율', noteEn: 'Same rate as item 9' },
    { key: 'r12', no: '12', kind: 'flat', unit: 'count', auto: false, rate: 1000,
      ko: '도선 취소 수수료', en: 'Pilotage cancellation fee',
      noteKo: '도선사 배정·대기 중 예약 시간 30분 이후 취소', noteEn: 'Cancelled more than 30 minutes after the booked time' },
    { key: 'r13', no: '13', kind: 'flat', unit: 'count', auto: false, rate: 1000,
      ko: '도선사 대기·지연 (1시간 초과)', en: 'Pilot detention / standby (over 1 hour)',
      noteKo: '1시간 이상 지연 시 시간과 무관한 고정 요금', noteEn: 'Fixed once the delay exceeds 1 hour' },
    { key: 'r14', no: '14', kind: 'flat', unit: 'count', auto: false, rate: 1500,
      ko: '내비게이션 지원 서비스', en: 'Navigation support services',
      noteKo: '제목은 "3시간 초과 시 시간당"이나 본문은 고정 $1,500 — 고정 요금으로 처리',
      noteEn: 'Title says "over 3 hours, per hour" but the text states a flat $1,500 — treated as flat' },
    { key: 'r15', no: '15', kind: 'flat', unit: 'count', auto: false, rate: 2000,
      ko: '선석 이동', en: 'Shifting berths',
      noteKo: '선석 이동 요청자 부담', noteEn: 'Borne by the party requesting the shift' },
    { key: 'r16', no: '16', kind: 'flat', unit: 'count', auto: false, rate: 100000,
      ko: '선석 이동 거부 벌금', en: 'Penalty for refusing to shift berth',
      noteKo: '일회성 벌금', noteEn: 'One-off penalty' },
    { key: 'r17', no: '17', kind: 'flat', unit: 'hours', auto: false, rate: 350,
      ko: '작업선 임대 (시간당)', en: 'Hire of launches (per hour)' },
    { key: 'r18', no: '18', kind: 'flat', unit: 'hours', auto: false, rate: 1000, tbc: true,
      ko: '항만구역 외 작업선 임대 (시간당)', en: 'Hire of launches outside harbour limits (per hour)',
      noteKo: '확인 필요: 회의록에 "$1,000? $350?"로 기록됨. 기본값 $1,000',
      noteEn: 'To be confirmed: recorded as "$1,000? $350?" in the notes. Default $1,000' }
  ];

  var GST_RATE = 0.15;

  var HOLIDAYS = [
    { date: '2026-01-01', ko: '신정', en: "New Year's Day" },
    { date: '2026-02-18', ko: '국군의 날', en: 'Armed Forces Day' },
    { date: '2026-03-08', ko: '세계 여성의 날', en: "International Women's Day" },
    { date: '2026-03-09', ko: '세계 여성의 날 (대체)', en: "International Women's Day (observed)" },
    { date: '2026-03-20', ko: '이드 알피트르', en: 'Eid al-Fitr' },
    { date: '2026-04-03', ko: '성금요일', en: 'Good Friday' },
    { date: '2026-04-06', ko: '부활절 월요일', en: 'Easter Monday' },
    { date: '2026-04-27', ko: '독립기념일', en: 'Independence Day' },
    { date: '2026-05-01', ko: '노동절', en: 'Labour Day' },
    { date: '2026-05-27', ko: '이드 알아드하 (타바스키)', en: 'Eid al-Adha (Tabaski)' },
    { date: '2026-08-25', ko: '예언자 탄신일 (마울리드)', en: "Prophet's Birthday (Mawlid)" },
    { date: '2026-12-25', ko: '성탄절', en: 'Christmas Day' },
    { date: '2026-12-26', ko: '박싱 데이', en: 'Boxing Day' },
    { date: '2026-12-28', ko: '박싱 데이 (대체)', en: 'Boxing Day (observed)' },
    { date: '2027-01-01', ko: '신정', en: "New Year's Day" },
    { date: '2027-02-18', ko: '국군의 날', en: 'Armed Forces Day' },
    { date: '2027-03-08', ko: '세계 여성의 날', en: "International Women's Day" },
    { date: '2027-03-09', ko: '이드 알피트르', en: 'Eid al-Fitr' },
    { date: '2027-03-26', ko: '성금요일', en: 'Good Friday' },
    { date: '2027-03-29', ko: '부활절 월요일', en: 'Easter Monday' },
    { date: '2027-04-27', ko: '독립기념일', en: 'Independence Day' },
    { date: '2027-05-01', ko: '노동절', en: 'Labour Day' },
    { date: '2027-05-16', ko: '이드 알아드하 (타바스키)', en: 'Eid al-Adha (Tabaski)' },
    { date: '2027-05-17', ko: '이드 알아드하 (대체)', en: 'Eid al-Adha (observed)' },
    { date: '2027-08-14', ko: '예언자 탄신일 (마울리드)', en: "Prophet's Birthday (Mawlid)" },
    { date: '2027-12-25', ko: '성탄절', en: 'Christmas Day' },
    { date: '2027-12-26', ko: '박싱 데이', en: 'Boxing Day' },
    { date: '2027-12-27', ko: '성탄절 (대체)', en: 'Christmas Day (observed)' },
    { date: '2027-12-28', ko: '박싱 데이 (대체)', en: 'Boxing Day (observed)' }
  ];

  var ANCHORAGES = [
    { name: '10 miles off', ko: '항만에서 약 10마일 떨어진 첫 번째 정박지', en: 'First anchorage, about 10 miles off the port' },
    { name: 'Charlie (STS area)', ko: 'STS(Ship-to-Ship) 작업 구역', en: 'STS (ship-to-ship) operations area' },
    { name: 'Bravo', ko: '세 번째 정박지', en: 'Third anchorage' },
    { name: 'Alpha', ko: '네 번째 정박지', en: 'Fourth anchorage' },
    { name: 'AB of Kington', ko: 'Kington 근처', en: 'Near Kington' },
    { name: 'F9', ko: '여섯 번째 정박지 구역', en: 'Sixth anchorage area' },
    { name: 'E6 (Echo 6)', ko: '일곱 번째 정박지', en: 'Seventh anchorage' },
    { name: 'E5 (Echo 5)', ko: '여덟 번째 정박지', en: 'Eighth anchorage' },
    { name: 'Bravo 1', ko: 'Delta 1 도달 전 지점', en: 'Point before reaching Delta 1' },
    { name: 'Delta 1 (D1)', ko: '내항 근처', en: 'Near the inner harbour' },
    { name: 'Delta 2 (D2)', ko: '열한 번째 정박지 — 특수 하역(10번) 작업 위치로도 언급', en: 'Eleventh anchorage — also a working location for special loading (item 10)' },
    { name: 'Aoki Oil', ko: '열두 번째 정박지', en: 'Twelfth anchorage' }
  ];

  function defaultRates() {
    var r = {};
    ITEMS.forEach(function (it) { r[it.key] = it.rate; });
    return r;
  }

  var api = {
    ITEMS: ITEMS, GST_RATE: GST_RATE, HOLIDAYS: HOLIDAYS, ANCHORAGES: ANCHORAGES,
    defaultRates: defaultRates
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.PortFeeData = api;
})(typeof self !== 'undefined' ? self : this);
