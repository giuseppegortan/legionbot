import zipfile
import io
import os

def generate_blueprint_zip(session_id: str, summary: str, messages: list):
    """
    Generates a ZIP file with the software blueprint structure.
    """
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # README.md
        readme_content = f"# Storm Blueprint: {session_id}\n\n## Summary\n{summary}\n\n## CLI Instructions\n- `claude serve`\n- `antigravity build`"
        zf.writestr("README.md", readme_content)
        
        # /claude_code
        zf.writestr("claude_code/instructions.md", "## Instructions for Claude\nImplement the microservices as discussed.")
        zf.writestr("claude_code/context.md", f"Messages context:\n{str(messages)}")
        
        # /gemini_antigravity
        zf.writestr("gemini_antigravity/spec.xml", "<storm_spec>\n  <session_id>" + session_id + "</session_id>\n</storm_spec>")
        
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
