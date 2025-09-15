from .. import db
from datetime import datetime
import uuid
import json

class PromptTemplate(db.Model):
    __tablename__ = 'prompt_templates'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    dependencies = db.Column(db.JSON, nullable=True, default=list)
    language = db.Column(db.String(5), nullable=False, default='en')
    status = db.Column(db.String(20), nullable=False, default='active')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super(PromptTemplate, self).__init__(**kwargs)
        if self.id is None:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'content': self.content,
            'category': self.category,
            'dependencies': self.dependencies or [],
            'language': self.language,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @classmethod
    def get_active_templates(cls, language='en', category=None):
        """Get active templates, optionally filtered by language and category"""
        query = cls.query.filter_by(status='active', language=language)
        if category:
            query = query.filter_by(category=category)
        return query.order_by(cls.created_at.desc()).all()

    @classmethod
    def get_categories(cls, language='en'):
        """Get all unique categories for active templates"""
        categories = db.session.query(cls.category).filter_by(
            status='active',
            language=language
        ).distinct().all()
        return [cat[0] for cat in categories]

    def get_dependencies_list(self):
        """Get dependencies as a list, handling JSON field"""
        if isinstance(self.dependencies, str):
            try:
                return json.loads(self.dependencies)
            except (json.JSONDecodeError, TypeError):
                return []
        return self.dependencies or []

    def has_dependency(self, dependency_key):
        """Check if template has a specific dependency"""
        deps = self.get_dependencies_list()
        return dependency_key in deps