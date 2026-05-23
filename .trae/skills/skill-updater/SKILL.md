---
name: "skill-updater"
description: "Updates or modifies existing SKILLs in the workspace. Invoke when the user asks to update, modify, or add self-updating capabilities to skills."
---

# Skill Updater

This skill helps you update or modify existing SKILLs for the workspace.

## When to Use

**CRITICAL: You MUST invoke this skill IMMEDIATELY as your FIRST action when:**
- User wants to update an existing skill
- User mentions "skills need to have self-updating" or modifying a skill's behavior
- User asks to refine or correct a skill

## SKILL Structure

A valid SKILL requires:
1. **Directory**: `.trae/skills/<skill-name>/`
2. **File**: `SKILL.md` inside the directory

## Required Fields

| Field | Location | Description |
|-------|----------|-------------|
| `name` | frontmatter | Unique identifier for the skill |
| `description` | frontmatter | **CRITICAL**: Must include (1) what the skill does AND (2) when to invoke it. Keep under 200 chars. |
| `detail` | body | Full markdown content after frontmatter |

## Update Steps

1. Find the skill to update in `.trae/skills/`
2. Read the existing `SKILL.md` file using the `Read` tool
3. Understand what needs to be changed (based on user request or architectural shifts)
4. Rewrite the `SKILL.md` file using the `Write` tool with the updated instructions
5. Ensure the `description` field still clearly states WHEN to invoke the skill.
