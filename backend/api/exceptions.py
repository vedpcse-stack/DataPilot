import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("datapilot")


class DataPilotError(Exception):
    """Raised for any expected, user-facing failure (bad CSV, bad target,
    unsupported column choice, etc). The message is safe to show as-is."""

    def __init__(self, message, status_code=status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def datapilot_exception_handler(exc, context):
    if isinstance(exc, DataPilotError):
        return Response({"error": exc.message}, status=exc.status_code)

    response = exception_handler(exc, context)
    if response is not None:
        return response

    # Anything unexpected: log the real traceback server-side, but never
    # leak it to the client.
    logger.exception("Unhandled DataPilot error")
    return Response(
        {"error": "Something went wrong while processing your request. Please try again."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
