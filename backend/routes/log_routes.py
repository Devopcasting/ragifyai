from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
from pathlib import Path
import json

router = APIRouter()


class LogEntry(BaseModel):
    timestamp: str
    level: str
    message: str
    logger: str


class LogResponse(BaseModel):
    entries: List[LogEntry]
    total_count: int
    log_file: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class LogStatsResponse(BaseModel):
    total_logs: int
    error_count: int
    api_requests: int
    document_uploads: int
    chat_messages: int
    last_24h_requests: int


@router.get("/files", response_model=List[str])
async def get_log_files():
    """Get list of available log files"""
    try:
        log_dir = Path("logs")
        if not log_dir.exists():
            return []

        log_files = [f.name for f in log_dir.glob("*.log")]
        return sorted(log_files)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{log_file}", response_model=LogResponse)
async def get_logs(
    log_file: str,
    lines: int = Query(
        100, description="Number of lines to retrieve (max 1000)"),
    level: Optional[str] = Query(None, description="Filter by log level"),
    start_time: Optional[str] = Query(
        None, description="Start time filter (ISO format)"),
    end_time: Optional[str] = Query(
        None, description="End time filter (ISO format)")
):
    """Get logs from a specific log file"""
    try:
        # Validate log file
        log_path = Path("logs") / log_file
        if not log_path.exists():
            raise HTTPException(
                status_code=404, detail=f"Log file {log_file} not found")

        # Limit lines to prevent memory issues
        lines = min(lines, 1000)

        # Read log file
        entries = []
        with open(log_path, 'r', encoding='utf-8') as f:
            log_lines = f.readlines()

        # Process last N lines
        for line in log_lines[-lines:]:
            try:
                # Parse log line (assuming format: timestamp - logger - level - message)
                parts = line.strip().split(" - ", 3)
                if len(parts) >= 4:
                    timestamp_str, logger, level_str, message = parts

                    # Apply level filter
                    if level and level_str.upper() != level.upper():
                        continue

                    # Apply time filter
                    if start_time or end_time:
                        try:
                            log_time = datetime.fromisoformat(
                                timestamp_str.replace(' ', 'T'))

                            if start_time:
                                start_dt = datetime.fromisoformat(start_time)
                                if log_time < start_dt:
                                    continue

                            if end_time:
                                end_dt = datetime.fromisoformat(end_time)
                                if log_time > end_dt:
                                    continue
                        except ValueError:
                            # Skip lines with invalid timestamps
                            continue

                    entries.append(LogEntry(
                        timestamp=timestamp_str,
                        level=level_str,
                        message=message,
                        logger=logger
                    ))
            except Exception:
                # Skip malformed log lines
                continue

        return LogResponse(
            entries=entries,
            total_count=len(entries),
            log_file=log_file,
            start_time=start_time,
            end_time=end_time
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/overview", response_model=LogStatsResponse)
async def get_log_stats():
    """Get overview statistics of all logs"""
    try:
        log_dir = Path("logs")
        if not log_dir.exists():
            return LogStatsResponse(
                total_logs=0,
                error_count=0,
                api_requests=0,
                document_uploads=0,
                chat_messages=0,
                last_24h_requests=0
            )

        total_logs = 0
        error_count = 0
        api_requests = 0
        document_uploads = 0
        chat_messages = 0
        last_24h_requests = 0

        # Calculate time 24 hours ago
        yesterday = datetime.now() - timedelta(hours=24)

        # Process each log file
        for log_file in log_dir.glob("*.log"):
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        total_logs += 1

                        # Count errors
                        if "ERROR" in line:
                            error_count += 1

                        # Count API requests
                        if "API Request:" in line:
                            api_requests += 1

                            # Check if within last 24 hours
                            try:
                                # Extract timestamp from log line
                                parts = line.split(" - ", 3)
                                if len(parts) >= 4:
                                    timestamp_str = parts[0]
                                    log_time = datetime.strptime(
                                        timestamp_str, "%Y-%m-%d %H:%M:%S,%f")
                                    if log_time > yesterday:
                                        last_24h_requests += 1
                            except:
                                pass

                        # Count document uploads
                        if "Document Upload:" in line:
                            document_uploads += 1

                        # Count chat messages
                        if "Chat Message:" in line:
                            chat_messages += 1

            except Exception:
                continue

        return LogStatsResponse(
            total_logs=total_logs,
            error_count=error_count,
            api_requests=api_requests,
            document_uploads=document_uploads,
            chat_messages=chat_messages,
            last_24h_requests=last_24h_requests
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{log_file}")
async def clear_log_file(log_file: str):
    """Clear a specific log file"""
    try:
        log_path = Path("logs") / log_file
        if not log_path.exists():
            raise HTTPException(
                status_code=404, detail=f"Log file {log_file} not found")

        # Clear the file
        with open(log_path, 'w') as f:
            f.write("")

        return {"message": f"Log file {log_file} cleared successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/")
async def clear_all_logs():
    """Clear all log files"""
    try:
        log_dir = Path("logs")
        if not log_dir.exists():
            return {"message": "No log files to clear"}

        cleared_count = 0
        for log_file in log_dir.glob("*.log"):
            try:
                with open(log_file, 'w') as f:
                    f.write("")
                cleared_count += 1
            except Exception:
                continue

        return {"message": f"Cleared {cleared_count} log files"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
