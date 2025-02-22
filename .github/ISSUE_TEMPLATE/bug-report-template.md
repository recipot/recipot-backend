---
name: Bug Report Template
about: 버그 관련 이슈 등록 템플릿입니다.
title: "[Bug] Write a title"
labels: "\U0001F41E BugFix"
assignees: ''

---

### 🐞 Bug Report
---  

### ⚠️ Issue  
- 발생한 문제에 대한 개요를 입력해주세요.  
- 예: *API 응답 시간이 비정상적으로 길어짐*  

### 🖥 환경 정보  
---
- **OS:** (예: Mac, Windows)  
- **Browser/Mobile:** (예: Chrome, Safari)  

### 🔁 재현 방법  
---
1. (버그를 재현하는 단계)  
2. (예상과 다른 동작 설명)  
3. (스크린샷이나 로그가 있으면 추가)  

### ✅ 기대 동작  
---
- 정상적으로 동작해야 하는 방식 설명  
- 예: *API 응답 시간이 500ms 이내여야 함*  

### ❌ 실제 동작  
---
- 현재 발생하는 문제 설명  
- 예: *응답 시간이 5초 이상 걸림*  

### 🗂 관련 로그 & 스크린샷 *(필요시 추가)*  
---
```json
{
   "error": "TimeoutException",
   "message": "Request took too long to respond"
}
