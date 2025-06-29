import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from utils.logger import log_api_request


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Record start time
        start_time = time.time()

        # Get request details
        method = request.method
        path = request.url.path
        user_agent = request.headers.get("user-agent")

        # Process the request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Log the request
        log_api_request(
            method=method,
            path=path,
            status_code=response.status_code,
            duration=duration,
            user_agent=user_agent
        )

        return response
