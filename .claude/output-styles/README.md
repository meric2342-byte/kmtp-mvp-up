# fluent-korean output-style (프로젝트 설치본)

Claude Code가 유창하고 의미가 명확한 한국어로 응답하게 만드는 출력 스타일입니다.

- 출처: https://github.com/snflkd/fluent-korean (MIT 라이선스, `LICENSE` 파일 참조)
- 원본 커밋: `10bfe7444f8abffaabf2c469b6ab2dada22db3ba`
- 원본 경로: `plugins/fluent-korean/output-styles/`

## 왜 플러그인이 아니라 파일로 넣었나

원래 설치 방법은 Claude Code CLI에서 아래 두 줄을 입력하는 것입니다.

```
/plugin marketplace add snflkd/fluent-korean
/plugin install fluent-korean@fluent-korean
```

그러나 이 작업이 진행된 클라우드 세션에서는 `/plugin` 명령을 사용할 수 없고, 세션이 끝나면 컨테이너가 사라져서 설치 결과도 함께 사라집니다. 그래서 원본 README가 안내하는 대체 방법에 따라, 출력 스타일 파일을 프로젝트 디렉토리인 `.claude/output-styles/`에 직접 배치했습니다. 이렇게 하면 저장소를 내려받은 모든 환경에서 설정이 그대로 유지됩니다.

## 포함된 두 가지 스타일

| 이름 | 용도 |
|---|---|
| `fluent-korean` | Claude Code의 코딩 지침을 유지합니다. 코드를 직접 수정하는 작업에 사용하세요. (현재 기본값) |
| `fluent-korean-not-coding` | 코딩 지침이 제거되어 있습니다. Claude가 코드를 고치지 않고 문서나 상담 위주로 작업할 때 사용하세요. |

## 기본값 변경 방법

`.claude/settings.json`의 `outputStyle` 값을 바꾸면 됩니다.

```json
{ "outputStyle": "fluent-korean-not-coding" }
```

한 번만 임시로 바꾸려면 Claude Code에서 `/output-style` 또는 `/config` 메뉴를 사용하세요.

## 유의 사항

- 출력 스타일은 시스템 프롬프트 단계에서 적용되므로, 값을 바꾼 뒤에는 새 세션을 시작하거나 `/clear`를 실행해야 반영됩니다.
- `fluent-korean.md` 끝에는 이 프로젝트에만 해당하는 「프로젝트 추가 조항」 절이 붙어 있습니다. 원본에는 없는 내용이므로, 원본을 갱신할 때에는 이 절을 다시 붙여 주거나 삭제하면 됩니다.
- 생략된 조사와 어미를 복원하기 때문에 토큰을 조금 더 사용합니다.
