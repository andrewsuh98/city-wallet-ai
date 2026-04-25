import json
import logging

import anthropic

from config import ANTHROPIC_API_KEY
from database import get_db

logger = logging.getLogger(__name__)

_client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

_SYSTEM_PROMPT = """You are a user intent classifier for a city wallet app.
Given a user's recent offer interactions and their current context, infer abstract intent signals.

Output only a JSON object with two fields:
- intent_tags: list of strings describing what the user likely wants right now (e.g. "seeking_warmth", "budget_conscious", "coffee_motivated", "time_pressured")
- past_categories: list of merchant category strings the user has positively engaged with

No markdown, no explanation. JSON only."""


async def get_user_preferences(session_id: str, context_tags: list[str]) -> dict:
    """
    Queries recent offer history for the session, calls Claude Haiku to infer
    intent tags and preferred categories. Returns empty preferences on any failure.
    """
    history = await _fetch_offer_history(session_id)
    if not history:
        return {"intent_tags": [], "past_categories": []}

    try:
        user_prompt = _build_prompt(history, context_tags)
        response = await _client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=256,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            timeout=3.0,
        )
        raw = response.content[0].text
        result = json.loads(raw)
        return {
            "intent_tags": result.get("intent_tags", []),
            "past_categories": result.get("past_categories", []),
        }
    except Exception:
        logger.warning(
            "SLM inference failed for session",
            extra={"session_id": session_id},
        )
        return {"intent_tags": [], "past_categories": []}


async def _fetch_offer_history(session_id: str) -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT merchant_category, context_tags, status
            FROM offers
            WHERE user_session_id = ?
              AND status IN ('accepted', 'declined', 'redeemed')
            ORDER BY created_at DESC
            LIMIT 20
            """,
            (session_id,),
        )
        rows = await cursor.fetchall()
        return [
            {
                "category": row["merchant_category"],
                "context_tags": json.loads(row["context_tags"] or "[]"),
                "status": row["status"],
            }
            for row in rows
        ]
    finally:
        await db.close()


def _build_prompt(history: list[dict], context_tags: list[str]) -> str:
    history_lines = [
        f"- {h['status'].upper()}: {h['category']} offer (context: {', '.join(h['context_tags'])})"
        for h in history
    ]
    return (
        f"Current context tags: {', '.join(context_tags)}\n\n"
        f"Recent offer interactions (newest first):\n"
        + "\n".join(history_lines)
    )
