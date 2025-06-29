import logging
import os
from datetime import datetime
from pathlib import Path
from logging.handlers import RotatingFileHandler
import json


class LoggerConfig:
    def __init__(self, log_dir="logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)

        # Configure different log files
        self.setup_loggers()

    def setup_loggers(self):
        """Setup different loggers for different purposes"""

        # Main application logger
        self.setup_logger(
            name="ragify",
            log_file="ragify.log",
            level=logging.INFO,
            format_str="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

        # API requests logger
        self.setup_logger(
            name="api",
            log_file="api.log",
            level=logging.INFO,
            format_str="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

        # Error logger
        self.setup_logger(
            name="errors",
            log_file="errors.log",
            level=logging.ERROR,
            format_str="%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s"
        )

        # Document processing logger
        self.setup_logger(
            name="documents",
            log_file="documents.log",
            level=logging.INFO,
            format_str="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

        # Chat logger
        self.setup_logger(
            name="chat",
            log_file="chat.log",
            level=logging.INFO,
            format_str="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

    def setup_logger(self, name: str, log_file: str, level: int, format_str: str):
        """Setup individual logger"""
        logger = logging.getLogger(name)
        logger.setLevel(level)

        # Clear existing handlers
        logger.handlers.clear()

        # Create formatter
        formatter = logging.Formatter(format_str)

        # File handler with rotation (10MB max, keep 5 files)
        file_handler = RotatingFileHandler(
            self.log_dir / log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(level)
        console_handler.setFormatter(formatter)

        # Add handlers
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

        # Prevent propagation to root logger
        logger.propagate = False

    def get_logger(self, name: str) -> logging.Logger:
        """Get a logger by name"""
        return logging.getLogger(name)

    def log_api_request(self, method: str, path: str, status_code: int, duration: float, user_agent: str | None = None):
        """Log API request details"""
        logger = self.get_logger("api")
        log_data = {
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration_ms": round(duration * 1000, 2),
            "user_agent": user_agent or "Unknown",
            "timestamp": datetime.now().isoformat()
        }
        logger.info(f"API Request: {json.dumps(log_data)}")

    def log_document_upload(self, filename: str, file_size: int, file_type: str, status: str):
        """Log document upload events"""
        logger = self.get_logger("documents")
        log_data = {
            "event": "document_upload",
            "filename": filename,
            "file_size": file_size,
            "file_type": file_type,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }
        logger.info(f"Document Upload: {json.dumps(log_data)}")

    def log_document_processing(self, filename: str, chunks_count: int, processing_time: float):
        """Log document processing events"""
        logger = self.get_logger("documents")
        log_data = {
            "event": "document_processing",
            "filename": filename,
            "chunks_count": chunks_count,
            "processing_time_seconds": round(processing_time, 2),
            "timestamp": datetime.now().isoformat()
        }
        logger.info(f"Document Processing: {json.dumps(log_data)}")

    def log_chat_message(self, session_id: int, message: str, response_length: int, processing_time: float):
        """Log chat messages"""
        logger = self.get_logger("chat")
        log_data = {
            "event": "chat_message",
            "session_id": session_id,
            "message_length": len(message),
            "response_length": response_length,
            "processing_time_seconds": round(processing_time, 2),
            "timestamp": datetime.now().isoformat()
        }
        logger.info(f"Chat Message: {json.dumps(log_data)}")

    def log_error(self, error: Exception, context: str | None = None):
        """Log errors with context"""
        logger = self.get_logger("errors")
        log_data = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or "No context provided",
            "timestamp": datetime.now().isoformat()
        }
        logger.error(f"Error: {json.dumps(log_data)}")


# Global logger instance
logger_config = LoggerConfig()


def get_logger(name: str) -> logging.Logger:
    """Get a logger by name"""
    return logger_config.get_logger(name)


def log_api_request(method: str, path: str, status_code: int, duration: float, user_agent: str | None = None):
    """Log API request details"""
    logger_config.log_api_request(
        method, path, status_code, duration, user_agent)


def log_document_upload(filename: str, file_size: int, file_type: str, status: str):
    """Log document upload events"""
    logger_config.log_document_upload(filename, file_size, file_type, status)


def log_document_processing(filename: str, chunks_count: int, processing_time: float):
    """Log document processing events"""
    logger_config.log_document_processing(
        filename, chunks_count, processing_time)


def log_chat_message(session_id: int, message: str, response_length: int, processing_time: float):
    """Log chat messages"""
    logger_config.log_chat_message(
        session_id, message, response_length, processing_time)


def log_error(error: Exception, context: str | None = None):
    """Log errors with context"""
    logger_config.log_error(error, context)
