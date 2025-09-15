from .. import db
from datetime import datetime, timedelta
import uuid


class UserCredit(db.Model):
    __tablename__ = 'user_credits'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    balance = db.Column(db.Integer, default=0, nullable=False)
    monthly_quota = db.Column(db.Integer, default=0, nullable=False)
    renewal_date = db.Column(db.DateTime, nullable=True)
    subscription_status = db.Column(db.String(20), default='inactive', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = db.relationship('User', backref=db.backref('credits', uselist=False))

    def __init__(self, user_id, initial_balance=50, monthly_quota=0, subscription_status='free_trial'):
        """
        Initialize user credits.
        
        Args:
            user_id: User ID
            initial_balance: Starting credits (default 50 for free trial)
            monthly_quota: Monthly allowance (0 for free trial, >0 for subscriptions)
            subscription_status: 'free_trial', 'active', 'inactive'
        """
        self.user_id = user_id
        self.balance = initial_balance
        self.monthly_quota = monthly_quota
        self.subscription_status = subscription_status
        
        # Set renewal date for active subscriptions
        if subscription_status == 'active' and monthly_quota > 0:
            self.renewal_date = datetime.utcnow() + timedelta(days=30)

    def has_sufficient_credits(self, required_amount):
        """Check if user has enough credits for an action."""
        return self.balance >= required_amount

    def deduct_credits(self, amount):
        """Deduct credits from balance. Returns True if successful, False if insufficient."""
        if self.balance >= amount:
            self.balance -= amount
            self.updated_at = datetime.utcnow()
            return True
        return False

    def add_credits(self, amount):
        """Add credits to balance."""
        self.balance += amount
        self.updated_at = datetime.utcnow()

    def is_renewal_due(self):
        """Check if monthly renewal is due."""
        if self.renewal_date and self.subscription_status == 'active':
            return datetime.utcnow() >= self.renewal_date
        return False

    def process_monthly_renewal(self):
        """Process monthly credit renewal for active subscriptions."""
        if self.subscription_status == 'active' and self.monthly_quota > 0:
            self.balance = self.monthly_quota  # Reset to full quota
            self.renewal_date = datetime.utcnow() + timedelta(days=30)  # Next month
            self.updated_at = datetime.utcnow()
            return True
        return False

    def get_usage_percentage(self):
        """Get percentage of monthly quota used."""
        if self.monthly_quota <= 0:
            return 0
        used = self.monthly_quota - self.balance
        return min(100, max(0, (used / self.monthly_quota) * 100))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'balance': self.balance,
            'monthly_quota': self.monthly_quota,
            'renewal_date': self.renewal_date.isoformat() if self.renewal_date else None,
            'subscription_status': self.subscription_status,
            'usage_percentage': self.get_usage_percentage(),
            'is_renewal_due': self.is_renewal_due(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<UserCredit user_id={self.user_id} balance={self.balance} quota={self.monthly_quota}>'