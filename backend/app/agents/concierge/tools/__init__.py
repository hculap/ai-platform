"""
Business Concierge Tools Package
Provides all tools for the Business Concierge Agent.
"""

from .analyzewebsiteTool import AnalyzeWebsiteTool


# Initialize and export all Business Concierge tools
CONCIERGE_TOOLS = {
    'analyze-website': AnalyzeWebsiteTool()
}


__all__ = [
    'AnalyzeWebsiteTool',
    'CONCIERGE_TOOLS'
]
