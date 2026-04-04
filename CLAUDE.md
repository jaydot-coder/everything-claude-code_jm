# CLAUDE.md

이 파일은 이 리포지토리의 코드로 작업할 때 Claude Code (claude.ai/code) 에 대한 지침을 제공합니다.

## 프로젝트 개요

이것은 **Claude Code 플러그인**입니다. 프로덕션 수준의 에이전트, 스킬, 훅, 명령어, 규칙, 그리고 MCP 설정 모음입니다. 이 프로젝트는 Claude Code를 사용하여 소프트웨어 개발을 할 때 검증된(battle-tested) 워크플로우를 제공합니다.

## 테스트 실행

```bash
# 모든 테스트 실행
node tests/run-all.js

# 개별 테스트 파일 실행
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
```

## 아키텍처

이 프로젝트는 몇 가지 핵심 컴포넌트로 구성되어 있습니다:

- **agents/** - 위임할 특화된 서브에이전트 (planner, code-reviewer, tdd-guide 등)
- **skills/** - 워크플로우 정의 및 도메인 지식 (코딩 표준, 패턴, 테스트)
- **commands/** - 사용자가 호출하는 슬래시 명령어 (/tdd, /plan, /e2e 등)
- **hooks/** - 트리거 기반 자동화 (세션 유지, 도구 사용 전/후 훅)
- **rules/** - 항상 따라야 하는 지침 (보안, 코딩 스타일, 테스트 요구사항)
- **mcp-configs/** - 외부 연동을 위한 MCP 서버 설정
- **scripts/** - 훅 및 설정을 위한 크로스 플랫폼 Node.js 유틸리티
- **tests/** - 스크립트 및 유틸리티를 위한 테스트 스위트

## 주요 명령어

- `/tdd` - 테스트 주도 개발 워크플로우
- `/plan` - 구현 계획
- `/e2e` - E2E 테스트 생성 및 실행
- `/code-review` - 품질 리뷰
- `/build-fix` - 빌드 에러 해결
- `/learn` - 세션에서 패턴 추출
- `/skill-create` - Git 히스토리에서 스킬 생성

## 개발 참고사항

- 패키지 매니저 감지: npm, pnpm, yarn, bun (`CLAUDE_PACKAGE_MANAGER` 환경 변수 또는 프로젝트 설정을 통해 구성 가능)
- 크로스 플랫폼: Node.js 스크립트를 통한 Windows, macOS, Linux 지원
- 에이전트 형식: YAML 프론트매터(name, description, tools, model)가 있는 Markdown
- 스킬 형식: 언제 사용해야 하는지, 작동 방식, 예시 등의 명확한 섹션이 있는 Markdown
- 훅 형식: 매처(matcher) 조건 및 명령어/알림 훅이 있는 JSON

## 기여하기

CONTRIBUTING.md의 형식을 따르세요:
- Agents: 프론트매터(name, description, tools, model)가 있는 Markdown
- Skills: 명확한 섹션 (When to Use, How It Works, Examples)
- Commands: 설명 프론트매터가 있는 Markdown
- Hooks: 매처 및 hooks 배열이 있는 JSON

파일 명명 규칙: 하이픈이 포함된 소문자 (예: `python-reviewer.md`, `tdd-workflow.md`)
