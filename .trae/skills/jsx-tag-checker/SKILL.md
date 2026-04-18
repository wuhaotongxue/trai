---
name: "jsx-tag-checker"
description: "Checks for unclosed JSX tags (div, span, etc.) in frontend and client files. Invoke before starting frontend/client services or when editing JSX/TSX files to prevent tag mismatches."
---

# JSX Tag Checker

This skill automatically checks for unclosed JSX tags (like &lt;div&gt;) in React components in the frontend_next and client_electron directories.

## Features

- Checks all .tsx and .jsx files in frontend_next and client_electron
- Validates that each opening tag has a corresponding closing tag
- Reports unclosed tags, mismatched tags, and tag errors
- Integrated with TypeScript compiler

## Usage

Invoke this skill:
1. Before starting frontend or client services
2. After editing JSX/TSX files
3. When seeing tag-related TypeScript errors

## How It Works

Runs TypeScript type checking with a focus on JSX syntax validation.

### Key Checks:
- Unclosed tags (&lt;div&gt; without &lt;/div&gt;)
- Mismatched tags (&lt;div&gt;...&lt;/span&gt;)
- Missing closing tags
- Invalid tag nesting
