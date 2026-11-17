# 항만 수수료 계산기 (Port Fee Calculator)

`port-fee-calculator-en.xlsx`의 계산을 옮긴 설치형 웹앱(PWA)입니다. 한글이 기본이고 오른쪽 위 버튼으로 영문 전환됩니다.

## 구성

| 경로 | 내용 |
|---|---|
| `public/index.html`, `style.css` | 화면 |
| `public/js/calc.js` | 계산 로직 (엑셀 `Calculator` 시트와 같은 규칙) |
| `public/js/data.js` | 요율 18종·GST·공휴일·정박지 기본값 |
| `public/js/i18n.js` | 한글/영문 문구 |
| `public/js/app.js` | 화면 동작, 기기 저장 |
| `public/sw.js`, `manifest.webmanifest`, `icons/` | 휴대폰 설치·오프라인 사용 |
| `test/calc.test.js` | 계산 검증 (`node --test test/calc.test.js`) |
| `tools/make-icons.js` | 아이콘 다시 만들기 (`node tools/make-icons.js`) |
| `.github/workflows/pages.yml` | GitHub Pages 배포 |
| `android/` | 안드로이드 APK용 껍데기 앱 (`public/`을 그대로 담아 WebView로 표시) |
| `.github/workflows/apk.yml` | APK 빌드 후 `apk` 릴리스에 첨부 |

## GitHub에 올리고 휴대폰에 설치

1. GitHub에서 빈 저장소 `port-fee-calculator`를 만들고 푸시합니다.

   ```bash
   git remote add origin https://github.com/johnnie0210/port-fee-calculator.git
   git push -u origin main
   ```

2. 저장소의 **Settings > Pages > Build and deployment > Source**를 **GitHub Actions**로 바꿉니다.
3. **Actions** 탭의 `pages` 작업이 끝나면 `https://johnnie0210.github.io/port-fee-calculator/`로 열립니다.
4. 휴대폰 크롬으로 그 주소를 열고, 화면 위 **앱 설치** 버튼이나 크롬 메뉴의 **앱 설치 / 홈 화면에 추가**를 누릅니다.

- 무료 계정은 공개(Public) 저장소에서만 Pages를 쓸 수 있습니다.

## APK로 설치

휴대폰에서 아래 주소를 열어 내려받은 뒤 파일을 열면 설치됩니다. 처음에는 "출처를 알 수 없는 앱 설치" 허용을 묻습니다.

https://github.com/johnnie0210/port-fee-calculator/releases/download/apk/port-fee-calculator.apk

- `public/`이나 `android/`를 고쳐 푸시하면 APK가 다시 만들어져 같은 주소에 올라갑니다. 새 파일을 내려받아 열면 기존 앱 위에 업데이트됩니다.
- APK 앱과 크롬으로 설치한 앱은 서로 다른 앱이라 저장된 요율·공휴일·입력값을 공유하지 않습니다.
- 서명 키(`android/app/sideload.keystore`)는 매번 같은 서명으로 빌드하려고 저장소에 넣어 둔 직접 설치용 키입니다. 스토어 등록용으로는 쓰지 않습니다.

## 수정 후 배포

파일을 고치면 `public/sw.js`의 `CACHE` 값을 올린 뒤(`portfee-v1` → `portfee-v2`) 푸시합니다. 설치된 휴대폰은 온라인 상태에서 앱을 다시 열면 새 버전을 받습니다.

## 저장되는 값

요율·공휴일·입력값·언어는 그 기기의 브라우저에만 저장됩니다. 서버로 보내는 값은 없습니다.
