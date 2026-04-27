"""Chat with DB — OpenAI GPT converts natural language to SQL and returns results."""

import json
import os
import textwrap

from openai import OpenAI
from sqlalchemy import text
from sqlalchemy.orm import Session

SYSTEM_PROMPT = textwrap.dedent("""\
    You are a helpful database assistant. The user will ask questions about a Copilot usage
    tracking database. Convert their natural language question into a safe, read-only SQL query
    and return the results with a brief human-readable explanation.

    DATABASE SCHEMA:
    
    Table: employees
      - id (INTEGER, PRIMARY KEY)
      - name (VARCHAR 255)
      - email (VARCHAR 255, UNIQUE)
      - department (VARCHAR 255)
      - team (VARCHAR 255)
      - role (VARCHAR 255)
      - copilot_enabled (BOOLEAN)
      - created_at (DATETIME)

    Table: copilot_usage
      - id (INTEGER, PRIMARY KEY)
      - employee_id (INTEGER, FK -> employees.id)
      - usage_date (DATE)
      - suggestions_shown (INTEGER)
      - suggestions_accepted (INTEGER)
      - lines_suggested (INTEGER)
      - lines_accepted (INTEGER)
      - active_time_minutes (INTEGER)
      - language (VARCHAR 100)
      - editor (VARCHAR 100)
      - acceptance_rate (FLOAT)

    RULES:
    1. ONLY generate SELECT queries. Never INSERT, UPDATE, DELETE, DROP, ALTER, or any DDL/DML.
    2. Always return valid SQL for SQLite.
    3. Respond ONLY with a JSON object in this exact format (no markdown, no code fences):
       {"sql": "<the SQL query>", "explanation": "<brief explanation of what the query does>"}
    4. If the user's question cannot be answered with a SQL query, return:
       {"sql": null, "explanation": "<explanation of why>"}
    5. Limit results to 50 rows max unless the user specifies otherwise.
    6. Use JOINs when the question involves both employees and usage data.
""")


def chat_with_db(question: str, db: Session, conversation_history: list[dict] | None = None) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {
            "answer": "OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.",
            "sql": None,
            "results": None,
            "error": True,
        }

    client = OpenAI(api_key=api_key)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": question})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0,
            max_tokens=1000,
        )
        content = response.choices[0].message.content.strip()

        # Parse JSON response from GPT
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        parsed = json.loads(content)
        sql_query = parsed.get("sql")
        explanation = parsed.get("explanation", "")

        if not sql_query:
            return {
                "answer": explanation,
                "sql": None,
                "results": None,
                "error": False,
            }

        # Safety check — only allow SELECT
        sql_upper = sql_query.strip().upper()
        if not sql_upper.startswith("SELECT"):
            return {
                "answer": "Only SELECT queries are allowed for safety reasons.",
                "sql": sql_query,
                "results": None,
                "error": True,
            }

        # Execute the query
        result = db.execute(text(sql_query))
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result.fetchall()]

        # Ask GPT to summarize the results
        summary_messages = [
            {"role": "system", "content": "You are a helpful assistant. Summarize the following database query results in a clear, human-readable way. Be concise but informative. Use bullet points or tables if appropriate. Do not use markdown code fences."},
            {"role": "user", "content": f"Question: {question}\n\nSQL: {sql_query}\n\nResults ({len(rows)} rows):\n{json.dumps(rows[:50], default=str)}"},
        ]

        summary_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=summary_messages,
            temperature=0.3,
            max_tokens=1500,
        )
        summary = summary_response.choices[0].message.content.strip()

        return {
            "answer": summary,
            "sql": sql_query,
            "results": rows[:50],
            "explanation": explanation,
            "error": False,
        }

    except json.JSONDecodeError:
        return {
            "answer": f"I understood your question but had trouble formatting the response. Here's what I got:\n\n{content}",
            "sql": None,
            "results": None,
            "error": True,
        }
    except Exception as e:
        return {
            "answer": f"Error: {str(e)}",
            "sql": None,
            "results": None,
            "error": True,
        }
