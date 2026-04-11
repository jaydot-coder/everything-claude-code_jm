---
description: 네이버 블로그 글 작성. 주제/키워드 또는 초안을 입력하면 사용자 말투로 블로그 글을 생성한다.
---

# Write Blog Command

네이버 블로그 글을 사용자의 말투로 작성하는 명령어.

## What This Command Does

1. **말투 샘플 확인** — `contexts/my-blog-style.md`에서 사용자의 글쓰기 스타일을 로드
2. **말투 분석** — `blog-style-mimic` 스킬로 어투, 문장 길이, 특징적 표현 등을 추출
3. **글 생성** — 주제/키워드 또는 초안을 기반으로 네이버 블로그 포맷의 글 작성
4. **리뷰 제시** — 초안을 보여주고 수정 요청을 대기

## Usage

### 키워드 모드

주제나 키워드만 입력하면 처음부터 글을 작성한다.

```
/write-blog 제주도 3박4일 여행 후기
/write-blog 홈카페 레시피 추천
/write-blog 신혼부부 인테리어 꿀팁
```

### 초안 모드

`--draft` 플래그와 함께 메모나 초안을 입력하면 말투에 맞게 리라이팅한다.

```
/write-blog --draft "오늘 강남역 근처 새로 생긴 파스타집 갔는데 크림파스타가 진짜 맛있었음. 가격은 15000원. 분위기도 좋고 직원도 친절. 재방문 의사 있음"
```

## 사전 준비

### 말투 샘플 등록 (최초 1회)

`contexts/my-blog-style.md` 파일에 평소 글쓰기 스타일이 담긴 텍스트를 추가한다.

좋은 샘플:
- 기존 블로그 글 2~3개
- SNS에 쓴 긴 글
- 메신저에서 긴 이야기한 내용
- 일기나 메모

샘플이 많을수록 말투 재현 정확도가 높아진다.

## How It Works

```
/write-blog "주제"
    ↓
contexts/my-blog-style.md 로드 (말투 규칙 + AI금지 패턴)
    ↓
contexts/blog-strategy.md 로드 (케넨 전략: 키워드/제목/본문)
    ↓
rules/common/naver-blog.md 참조 (포맷 규칙)
    ↓
글 작성 전 체크리스트 적용 (키워드→스마트블록→소주제 구성)
    ↓
초안 제시 → 수정 요청 대기 → 최종본 확정
```

## Related

- **Agent**: `blog-writer` — 글 생성 전담 에이전트
- **Skill**: `blog-style-mimic` — 말투 분석 및 모방
- **Rule**: `naver-blog` — 네이버 블로그 포맷 규칙
- **Context**: `my-blog-style.md` — 사용자 말투 샘플
