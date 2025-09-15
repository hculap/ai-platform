from .. import db
from datetime import datetime
import uuid


class CreditTransaction(db.Model):
    __tablename__ = 'credit_transactions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # 'earned', 'spent', 'expired', 'renewal'
    amount = db.Column(db.Integer, nullable=False)  # Positive for earned, negative for spent
    balance_after = db.Column(db.Integer, nullable=False)  # Balance after this transaction
    description = db.Column(db.String(255), nullable=False)
    tool_slug = db.Column(db.String(100), nullable=True)  # For 'spent' transactions
    interaction_id = db.Column(db.String(36), db.ForeignKey('interactions.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', backref='credit_transactions')
    interaction = db.relationship('Interaction', backref='credit_transaction', uselist=False)

    # Transaction types
    TYPE_EARNED = 'earned'
    TYPE_SPENT = 'spent'
    TYPE_EXPIRED = 'expired'
    TYPE_RENEWAL = 'renewal'
    TYPE_INITIAL = 'initial'

    def __init__(self, user_id, transaction_type, amount, balance_after, description, 
                 tool_slug=None, interaction_id=None):
        """
        Create a credit transaction record.
        
        Args:
            user_id: User ID
            transaction_type: Type of transaction (earned/spent/expired/renewal/initial)
            amount: Credit amount (positive for earned, negative for spent)
            balance_after: User's balance after this transaction
            description: Human-readable description
            tool_slug: Tool identifier for spent transactions
            interaction_id: Related interaction for spent transactions
        """
        self.user_id = user_id
        self.transaction_type = transaction_type
        self.amount = amount
        self.balance_after = balance_after
        self.description = description
        self.tool_slug = tool_slug
        self.interaction_id = interaction_id

    @classmethod
    def create_earned_transaction(cls, user_id, amount, balance_after, reason):
        """Create a transaction for earning credits."""
        return cls(
            user_id=user_id,
            transaction_type=cls.TYPE_EARNED,
            amount=amount,
            balance_after=balance_after,
            description=f"Credits earned: {reason}"
        )

    @classmethod
    def create_spent_transaction(cls, user_id, amount, balance_after, tool_slug, interaction_id):
        """Create a transaction for spending credits on a tool."""
        return cls(
            user_id=user_id,
            transaction_type=cls.TYPE_SPENT,
            amount=-amount,  # Negative for spending
            balance_after=balance_after,
            description=f"Used {tool_slug.replace('-', ' ').title()} tool",
            tool_slug=tool_slug,
            interaction_id=interaction_id
        )

    @classmethod
    def create_renewal_transaction(cls, user_id, amount, balance_after):
        """Create a transaction for monthly renewal."""
        return cls(
            user_id=user_id,
            transaction_type=cls.TYPE_RENEWAL,
            amount=amount,
            balance_after=balance_after,
            description="Monthly credit renewal"
        )

    @classmethod
    def create_initial_transaction(cls, user_id, amount, balance_after):
        """Create a transaction for initial free trial credits."""
        return cls(
            user_id=user_id,
            transaction_type=cls.TYPE_INITIAL,
            amount=amount,
            balance_after=balance_after,
            description="Welcome bonus: Free trial credits"
        )

    @classmethod
    def create_expired_transaction(cls, user_id, amount, balance_after):
        """Create a transaction for expired credits."""
        return cls(
            user_id=user_id,
            transaction_type=cls.TYPE_EXPIRED,
            amount=-amount,  # Negative for expiry
            balance_after=balance_after,
            description="Credits expired due to inactive subscription"
        )

    def get_display_color(self):
        """Get color class for UI display based on transaction type."""
        color_map = {
            self.TYPE_EARNED: 'text-green-600',
            self.TYPE_SPENT: 'text-red-600',
            self.TYPE_EXPIRED: 'text-gray-600',
            self.TYPE_RENEWAL: 'text-blue-600',
            self.TYPE_INITIAL: 'text-green-600'
        }
        return color_map.get(self.transaction_type, 'text-gray-600')

    def get_display_icon(self):
        """Get icon for UI display based on transaction type."""
        icon_map = {
            self.TYPE_EARNED: '↗',
            self.TYPE_SPENT: '↘',
            self.TYPE_EXPIRED: '⌛',
            self.TYPE_RENEWAL: '🔄',
            self.TYPE_INITIAL: '🎁'
        }
        return icon_map.get(self.transaction_type, '•')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'transaction_type': self.transaction_type,
            'amount': self.amount,
            'balance_after': self.balance_after,
            'description': self.description,
            'tool_slug': self.tool_slug,
            'interaction_id': self.interaction_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'display_color': self.get_display_color(),
            'display_icon': self.get_display_icon()
        }

    def __repr__(self):
        return f'<CreditTransaction user_id={self.user_id} type={self.transaction_type} amount={self.amount}>'