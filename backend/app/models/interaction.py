"""
Interaction model for tracking agent tool executions.
"""

from .. import db
from datetime import datetime
import uuid


class Interaction(db.Model):
    """Model for tracking agent tool interactions."""

    __tablename__ = 'interactions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=True)  # Can be null for public access
    business_profile_id = db.Column(db.String(36), nullable=True)

    # Agent and tool information
    agent_type = db.Column(db.String(100), nullable=False)
    agent_name = db.Column(db.String(255), nullable=False)
    tool_name = db.Column(db.String(100), nullable=False)
    tool_description = db.Column(db.Text)

    # Execution details
    status = db.Column(db.String(50), nullable=False, default='processing')  # processing, completed, failed
    input_data = db.Column(db.JSON, nullable=True)
    output_data = db.Column(db.JSON, nullable=True)
    error_message = db.Column(db.Text, nullable=True)

    # Timing
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Metadata
    execution_time = db.Column(db.Float, nullable=True)  # in seconds
    agent_version = db.Column(db.String(50), nullable=True)
    tool_version = db.Column(db.String(50), nullable=True)

    def __init__(
        self,
        user_id=None,
        business_profile_id=None,
        agent_type='',
        agent_name='',
        tool_name='',
        tool_description='',
        input_data=None
    ):
        self.user_id = user_id
        self.business_profile_id = business_profile_id
        self.agent_type = agent_type
        self.agent_name = agent_name
        self.tool_name = tool_name
        self.tool_description = tool_description
        self.input_data = input_data or {}
        self.started_at = datetime.utcnow()

    def mark_completed(self, output_data=None, execution_time=None):
        """Mark interaction as completed."""
        self.status = 'completed'
        self.output_data = output_data or {}
        self.execution_time = execution_time
        self.completed_at = datetime.utcnow()

    def mark_failed(self, error_message='', execution_time=None):
        """Mark interaction as failed."""
        self.status = 'failed'
        self.error_message = error_message
        self.execution_time = execution_time
        self.completed_at = datetime.utcnow()

    def to_dict(self):
        """Convert interaction to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'business_profile_id': self.business_profile_id,
            'agent_name': self.agent_name,
            'tool_name': self.tool_name,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'execution_time': self.execution_time
        }

    def to_detail_dict(self):
        """Convert interaction to detailed dictionary."""
        return {
            **self.to_dict(),
            'agent_type': self.agent_type,
            'tool_description': self.tool_description,
            'input_data': self.input_data,
            'output_data': self.output_data,
            'error_message': self.error_message,
            'agent_version': self.agent_version,
            'tool_version': self.tool_version
        }
