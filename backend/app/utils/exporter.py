import zipfile
import io
import os

def generate_blueprint_zip(session_id: str, analysis: str, messages: list):
    """
    Generates a professional ZIP file where README.md is the Application Analysis.
    """
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # README.md - The Core Analysis & Specification
        readme_content = f"""# 🌩️ STORM ENGINE: Application Analysis
## Session ID: {session_id}

{analysis}

---
### 🛠️ Developer Handoff & CLI
- **Claude Code**: All conversation context is available in `claude_code/`.
- **Antigravity**: Specs for automated build in `gemini_antigravity/`.
- **System**: This blueprint was orchestrated by Architect, Developer, and Secretary agents.
"""
        zf.writestr("README.md", readme_content.strip())
        
        # /claude_code/context.md - Formatted log for Claude
        conversation_log = "## Storm Orchestration Log\n\n"
        for m in messages:
            role = m.get('sender', m.get('role', 'Unknown'))
            timestamp = m.get('timestamp', 'N/A')
            content = m.get('content', '')
            conversation_log += f"### {role} ({timestamp})\n{content}\n\n---\n\n"
        
        zf.writestr("claude_code/context.md", conversation_log.strip())
        
        # /claude_code/instructions.md - Clear instructions
        instructions = """# Implementation Instructions
This project was designed using STORM ENGINE.
Please follow these steps:
1. Review the `context.md` for full design rationale.
2. Implement the core logic as defined by the **Architect**.
3. Apply optimization patterns suggested by the **Developer**.
4. Verify results with the **Secretary's** summary.
"""
        zf.writestr("claude_code/instructions.md", instructions.strip())
        
        # /gemini_antigravity/spec.xml
        spec_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<storm_spec>
    <session_id>{session_id}</session_id>
    <agents>
        <agent>Architect</agent>
        <agent>Developer</agent>
        <agent>Secretary</agent>
    </agents>
    <status>FINALIZED</status>
</storm_spec>"""
        zf.writestr("gemini_antigravity/spec.xml", spec_xml.strip())
        
    buffer.seek(0)
    return buffer

def save_zip_to_disk(buffer, session_id: str):
    export_dir = "exports"
    if not os.path.exists(export_dir):
        os.makedirs(export_dir)
    file_path = os.path.join(export_dir, f"{session_id}.zip")
    with open(file_path, "wb") as f:
        f.write(buffer.read())
    return file_path
