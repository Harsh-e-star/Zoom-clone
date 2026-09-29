import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class InMemoryRateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Lightweight, high-performance in-memory rate limiting middleware.
    Protects auth and sensitive API endpoints against brute force and DDoS attacks.
    """

    def __init__(self, app):
        super().__init__(app)
        # Store timestamp lists per IP: endpoint_category -> ip -> list of timestamps
        self.requests: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: defaultdict(list))
        self.last_cleanup = time.time()

        # Rules: (path_prefix, max_requests, window_seconds)
        self.rules = [
            ("/api/auth/login", 20, 60),
            ("/api/auth/signup", 10, 60),
            ("/api/auth/forgot-password", 5, 60),
            ("/api/auth/reset-password", 10, 60),
            ("/api/meetings/schedule", 30, 60),
            ("/api/", 300, 60),  # General API limit
        ]

    def _cleanup_old_records(self, now: float):
        if now - self.last_cleanup < 60:
            return
        self.last_cleanup = now
        for category, ip_dict in list(self.requests.items()):
            for ip, timestamps in list(ip_dict.items()):
                # Keep timestamps within last 60 seconds
                valid = [t for t in timestamps if now - t < 60]
                if valid:
                    ip_dict[ip] = valid
                else:
                    del ip_dict[ip]

    async def dispatch(self, request: Request, call_next):
        # Do not rate limit WebSocket handshakes, docs, or health checks
        path = request.url.path
        if path.startswith("/ws/") or path.startswith("/health") or path.startswith("/docs") or path.startswith("/openapi.json"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        # Handle X-Forwarded-For if behind a proxy
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        now = time.time()
        self._cleanup_old_records(now)

        for prefix, max_reqs, window in self.rules:
            if path.startswith(prefix):
                category = prefix
                timestamps = self.requests[category][client_ip]
                # Filter timestamps in current window
                recent = [t for t in timestamps if now - t < window]
                if len(recent) >= max_reqs:
                    retry_after = int(window - (now - recent[0])) + 1
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "error": "Too Many Requests",
                            "message": f"Rate limit exceeded for {prefix}. Please try again in {retry_after} seconds.",
                        },
                        headers={"Retry-After": str(max(1, retry_after))},
                    )

                recent.append(now)
                self.requests[category][client_ip] = recent
                break

        response = await call_next(request)
        return response
