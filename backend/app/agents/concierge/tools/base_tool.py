"""
Base tool class for all agent tools.
Provides common functionality and interfaces for tool execution.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass


@dataclass
class ToolInput:
    """Input structure for tool execution"""
    parameters: Dict[str, Any]
    user_id: Optional[int] = None
    context: Optional[Any] = None


@dataclass
class ToolMetadata:
    """Metadata for tool execution"""
    tool_name: str
    execution_time: float
    timestamp: str


@dataclass
class ToolOutput:
    """Output structure for tool execution"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    metadata: Optional[ToolMetadata] = None


class BaseTool(ABC):
    """Abstract base class for all agent tools"""

    def __init__(self, name: str, description: str, version: str = "1.0.0"):
        self.name = name
        self.description = description
        self.version = version

    @abstractmethod
    async def execute(self, input_data: ToolInput) -> ToolOutput:
        """Execute the tool with given input"""
        pass

    def create_metadata(self, execution_time: float) -> ToolMetadata:
        """Create tool metadata"""
        return ToolMetadata(
            tool_name=self.name,
            execution_time=execution_time,
            timestamp=datetime.now().isoformat()
        )
