"""
Logging utility helpers for the AI Platform backend.
Provides convenient functions for enhanced logging across the application.
"""

import logging
import traceback
from datetime import datetime
from typing import Optional


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module.
    
    Args:
        name: Name of the logger (e.g., 'app.routes.agents')
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


def log_api_error(logger: logging.Logger, error: Exception, 
                  endpoint: str, method: str = "Unknown", 
                  user_id: Optional[str] = None,
                  additional_context: Optional[dict] = None):
    """
    Log API errors with comprehensive context.
    
    Args:
        logger: Logger instance to use
        error: Exception object
        endpoint: API endpoint where error occurred
        method: HTTP method
        user_id: User ID if available
        additional_context: Additional context dictionary
    """
    from flask import request, has_request_context
    
    error_details = [
        f"API ERROR: {endpoint}",
        f"Error Type: {type(error).__name__}",
        f"Error Message: {str(error)}",
        f"Method: {method}",
        f"Timestamp: {datetime.now().isoformat()}",
    ]
    
    if user_id:
        error_details.append(f"User ID: {user_id}")
    
    if additional_context:
        error_details.append(f"Additional Context: {additional_context}")
    
    # Add request details if available
    if has_request_context():
        try:
            error_details.extend([
                f"Request URL: {request.url}",
                f"Request Args: {dict(request.args)}",
                f"Request JSON: {request.get_json(silent=True)}",
                f"Remote Address: {request.remote_addr}",
                f"User Agent: {request.headers.get('User-Agent', 'Unknown')}",
            ])
        except Exception as req_error:
            error_details.append(f"Could not get request details: {req_error}")
    
    # Add full stack trace
    error_details.extend([
        "Full Stack Trace:",
        traceback.format_exc()
    ])
    
    # Log as error with all details
    logger.error("\n".join(error_details))


def log_agent_error(logger: logging.Logger, error: Exception, 
                   agent_slug: str, tool_slug: Optional[str] = None,
                   execution_context: Optional[dict] = None):
    """
    Log agent execution errors with agent-specific context.
    
    Args:
        logger: Logger instance to use
        error: Exception object
        agent_slug: Agent identifier
        tool_slug: Tool identifier if applicable
        execution_context: Additional execution context
    """
    error_details = [
        f"AGENT EXECUTION ERROR: {agent_slug}",
        f"Error Type: {type(error).__name__}",
        f"Error Message: {str(error)}",
        f"Timestamp: {datetime.now().isoformat()}",
    ]
    
    if tool_slug:
        error_details.append(f"Tool: {tool_slug}")
    
    if execution_context:
        error_details.append(f"Execution Context: {execution_context}")
    
    # Add full stack trace
    error_details.extend([
        "Full Stack Trace:",
        traceback.format_exc()
    ])
    
    # Log as error
    logger.error("\n".join(error_details))


def log_database_error(logger: logging.Logger, error: Exception, 
                      operation: str, model: Optional[str] = None):
    """
    Log database operation errors.
    
    Args:
        logger: Logger instance to use
        error: Exception object
        operation: Database operation (create, update, delete, query, etc.)
        model: Model name if applicable
    """
    error_details = [
        f"DATABASE ERROR: {operation}",
        f"Error Type: {type(error).__name__}",
        f"Error Message: {str(error)}",
        f"Timestamp: {datetime.now().isoformat()}",
    ]
    
    if model:
        error_details.append(f"Model: {model}")
    
    # Add full stack trace
    error_details.extend([
        "Full Stack Trace:",
        traceback.format_exc()
    ])
    
    # Log as error
    logger.error("\n".join(error_details))


def log_info_with_context(logger: logging.Logger, message: str, 
                         context: Optional[dict] = None):
    """
    Log info messages with optional context.
    
    Args:
        logger: Logger instance to use
        message: Info message
        context: Optional context dictionary
    """
    if context:
        logger.info(f"{message} - Context: {context}")
    else:
        logger.info(message)


def log_debug_with_context(logger: logging.Logger, message: str, 
                          context: Optional[dict] = None):
    """
    Log debug messages with optional context.
    
    Args:
        logger: Logger instance to use
        message: Debug message
        context: Optional context dictionary
    """
    if context:
        logger.debug(f"{message} - Context: {context}")
    else:
        logger.debug(message)