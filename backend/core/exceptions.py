"""
Global Exception Handler for DRF
Converts all errors into a clean, consistent JSON format.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import traceback

def custom_exception_handler(exc, context):
    # Let DRF handle standard API exceptions first (like ValidationErrors, NotAuthenticated)
    response = exception_handler(exc, context)

    # If DRF didn't handle it, it's a standard Python error (e.g., Database crash, 500 error)
    if response is None:
        # Print the error to the server terminal for debugging
        print("\n[SERVER ERROR]")
        traceback.print_exc()
        
        # Return a clean JSON response to the user (don't leak stack traces to the public!)
        return Response(
            {
                "success": False,
                "error": "A server error occurred. Our team has been notified.",
                "details": str(exc) # Only show details in DEBUG mode (handled by settings)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Format the DRF errors to match our desired structure
    if isinstance(response.data, list):
        # Handle list errors (rare)
        formatted_errors = response.data
    elif isinstance(response.data, dict):
        # Handle dictionary errors (common for serializer validation)
        formatted_errors = {}
        for key, value in response.data.items():
            if isinstance(value, list):
                formatted_errors[key] = value[0] # Take the first error message
            else:
                formatted_errors[key] = str(value)
    else:
        formatted_errors = response.data

    # Rebuild the response with our clean format
    response.data = {
        "success": False,
        "error": formatted_errors
    }

    return response