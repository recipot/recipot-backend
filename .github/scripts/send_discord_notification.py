import os
import json
import requests
from datetime import datetime

# 환경 변수 로딩
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
NOTION_DB_ID = os.getenv("NOTION_DB_ID")
MAKE_WEBHOOK_URL = os.getenv("MAKE_WEBHOOK_URL")
GITHUB_EVENT_PATH = os.getenv("GITHUB_EVENT_PATH")
GITHUB_EVENT_NAME = os.getenv("GITHUB_EVENT_NAME")

# Notion API 헤더
notion_headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",  # 수정된 버전
    "Content-Type": "application/json"
}

def main():
    with open(GITHUB_EVENT_PATH, "r") as f:
        event = json.load(f)

    github_id = event.get("sender", {}).get("login")
    discord_id = get_discord_id(github_id)
    assignees = f"<@{discord_id}>" if discord_id else github_id

    if GITHUB_EVENT_NAME == "issues":
        created_at_str = event["issue"]["created_at"]
        dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))

        title = event["issue"]["title"]
        url = event["issue"]["html_url"]
        issue_number = event["issue"]["number"]
        msg_title = "📢 새로운 이슈가 등록되었습니다!"
        msg_body = (f"🔗 **{title}** ([#{issue_number}]({url}))"
                    f"\n👤 **담당자:** {assignees}"
                    f"\n🕒 **등록 시간:** {format_datetime(dt)}"
                    f"\n📌 확인 부탁드립니다!")
        send_discord_embed(msg_title, msg_body)

    elif GITHUB_EVENT_NAME == "pull_request" and event.get("action") == "opened":
        created_at_str = event["pull_request"]["created_at"]
        dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))

        pr = event["pull_request"]
        title = pr["title"]
        url = pr["html_url"]
        reviewers = [get_discord_id(r["login"]) or r["login"] for r in pr.get("requested_reviewers", [])]
        formatted_reviewer = ", ".join([f"<@{r}>" if r.startswith("1") else r for r in reviewers]) or "없음"
        msg_title = f"🚀 {assignees}님이 새로운 PR을 생성했습니다!"
        msg_body = (f"👀 **리뷰어:** {formatted_reviewer}"
                    f"\n🕒 **등록 시간:** {format_datetime(dt)}"
                    f"\n💡 [PR 보러 가기]({url})")
        send_discord_embed(msg_title, msg_body)

    elif GITHUB_EVENT_NAME == "pull_request_review":
        submitted_at_str = event["review"]["submitted_at"]
        dt = datetime.fromisoformat(submitted_at_str.replace("Z", "+00:00"))

        pr = event["pull_request"]
        title = pr["title"]
        url = pr["html_url"]
        reviewers = assignees
        pr_author_id = get_discord_id(pr["user"]["login"]) or pr["user"]["login"]
        assignees = f"<@{pr_author_id}>" if pr_author_id.startswith("1") else pr_author_id
        msg_title = "✅ PR 리뷰가 완료되었습니다!"
        msg_body = (f"👤 **담당자:** {assignees}"
                    f"\n👀 **리뷰어:** {reviewers}"
                    f"\n🕒 **등록 시간:** {format_datetime(dt)}"
                    f"\n🎉 [PR 보러 가기]({url}) 이제 머지 타임입니다 🕺")
        send_discord_embed(msg_title, msg_body)

    else:
        print(f"⚠️ Unknown Event: {GITHUB_EVENT_NAME}")
        return

def format_datetime(dt):
    return dt.strftime("%Y.%m.%d %p %I:%M").replace("AM", "오전").replace("PM", "오후")

def get_discord_id(github_id):
    url = f"https://api.notion.com/v1/databases/{NOTION_DB_ID}/query"
    body = {
        "filter": {
            "property": "github_id",
            "rich_text": {
                "equals": github_id
            }
        }
    }
    res = requests.post(url, headers=notion_headers, json=body)
    if res.status_code != 200:
        print(f"⚠️ Notion API Error: {res.text}")
        return None

    results = res.json().get("results", [])
    if not results:
        return None

    try:
        return results[0]["properties"]["discord_id"]["rich_text"][0]["plain_text"]
    except Exception as e:
        print(f"⚠️ Discord ID Parsing Error: {e}")
        return None

def send_discord_embed(title, description):
    payload = {
        "embeds": [
            {
                "title": title,
                "description": description
            }
        ]
    }

    res = requests.post(MAKE_WEBHOOK_URL, json=payload)
    if res.status_code != 200:
        print(f"Failed to send to Discord: {res.text}")
    else:
        print("Message sent Successfully!")

if __name__ == "__main__":
    main()