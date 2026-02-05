import logging
import sys
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("storm_engine")

def log_request(endpoint: str, user_id: str = None):
    """Log incoming API requests"""
    logger.info(f"📥 REQUEST: {endpoint} | User: {user_id or 'Anonymous'}")

def log_error(error: Exception, context: str = ""):
    """Log errors with context"""
    logger.error(f"❌ ERROR in {context}: {str(error)}", exc_info=True)

def log_agent_execution(agent_name: str, thread_id: int):
    """Log agent execution details"""
    logger.debug(f"🧵 AGENT [{agent_name}] executing on thread {thread_id}")

def log_success(message: str):
    """Log successful operations"""
    logger.info(f"✅ SUCCESS: {message}")
