# 에셋 안내

모든 이미지는 `assets_input/`의 원본을 `_workspace/convert_assets.py`로 변환해 만들었다(원본은 수정하지 않음).
다시 만들려면 프로젝트 루트에서 `python -I _workspace/convert_assets.py`를 실행한다.

## 현재 파일

| 파일 | 원본 | 용도 |
| --- | --- | --- |
| `img/keyart.webp`, `img/keyart-240.webp` | icon_square_600.png | 히어로, 이야기 섹션 캐릭터 카드 |
| `img/logo-icon.webp`(64), `img/logo-icon-192.webp` | icon_512x512.jpg | 내비 로고, 최종 CTA 아이콘 |
| `icons/favicon-32.png`, `icons/apple-touch-icon.png`(180) | icon_512x512.jpg | 파비콘, iOS 홈 화면 |
| `img/og-image.png` | promo_07_skill_mastery_1024x500.png | SNS 공유 이미지(1024x500) |
| `img/*-shot-1200.webp`, `img/*-shot-720.webp` (8종) | promo_01~08 | 본문용 화면 컷. 상단 문구 띠와 프레임을 잘라냄(잘라내기 영역 x 34~1471, y 130~724) |
| `img/promo-0N-1504.webp`, `img/promo-0N-720.webp` (8종) | promo_01~08 | 갤러리 원본(문구 포함) / 썸네일 |

## 자리표시·교체 권장 목록

현재 자리표시(가짜 이미지)는 없다. 아래는 실제 자료가 생기면 교체하거나 추가할 항목이다.

| 항목 | 현재 처리 | 교체 방법 |
| --- | --- | --- |
| 트레일러 / 전투 루프 영상 | 전투 섹션은 화면 컷 + 3단계 카드 | YouTube 주소가 생기면 전투 섹션에 임베드 추가 |
| 1200x630 공유 이미지 | 1024x500 배너 사용 | `img/og-image.png`를 같은 이름으로 덮어쓰고 index.html의 og:image:width/height 수정 |
| 투명 배경 타이틀 로고 | 글꼴(Black Han Sans)로 게임명 표시 | 히어로 `h1` 안에 `<img>`로 교체(alt="체이서 테일즈 3D") |
| 개발용 로그("셰이더 예열")·키보드 안내 없는 재캡처 | 현재 프로모 사용 | 같은 크기(1504x741) PNG를 assets_input/에 넣고 변환 스크립트 재실행 |
| 리네아(푸른 마녀) 일러스트 | 사용 안 함 | 기획 확정 후 이야기 섹션에 추가 |
