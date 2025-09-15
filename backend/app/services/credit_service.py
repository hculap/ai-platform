"""
Credit Service for managing user credits and transactions.
Handles credit balance validation, deduction, renewal, and transaction logging.
"""

import logging
import importlib
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError

from .. import db
from ..models.user_credit import UserCredit
from ..models.credit_transaction import CreditTransaction
from ..models.user import User

logger = logging.getLogger(__name__)


class CreditService:
    """Service class for managing credit operations."""
    
    # Tool class mapping for dynamic imports
    TOOL_CLASS_MAPPING = {
        'analyze-website': 'app.agents.concierge.tools.analyzewebsiteTool.AnalyzeWebsiteTool',
        'find-competitors': 'app.agents.competitors_researcher.tools.findCompetitorsTool.FindCompetitorsTool',
        'enrich-competitor': 'app.agents.competitors_researcher.tools.enrichCompetitorTool.EnrichCompetitorTool', 
        'analyze-style': 'app.agents.writer_agent.tools.style_analyzer_tool.StyleAnalyzerTool',
        'generate-script-hooks': 'app.agents.writer_agent.tools.generateScriptHooksTool.GenerateScriptHooksTool',
        'generate-script': 'app.agents.writer_agent.tools.generateScriptTool.GenerateScriptTool',
        'generate-offers': 'app.agents.offer_assistant.tools.generateOffersTool.GenerateOffersTool',
        'generate-campaign': 'app.agents.campaign_generator.tools.generateCampaignTool.GenerateCampaignTool',
        'generate-headlines': 'app.agents.ads_agent.tools.generateHeadlinesTool.GenerateHeadlinesTool',
        'generate-full-creative': 'app.agents.ads_agent.tools.generateFullCreativeTool.GenerateFullCreativeTool'
    }

    @staticmethod
    def get_or_create_user_credits(user_id: str) -> UserCredit:
        """
        Get user's credit record or create one with initial free trial credits.
        
        Args:
            user_id: User ID
            
        Returns:
            UserCredit instance
        """
        try:
            user_credit = UserCredit.query.filter_by(user_id=user_id).first()
            
            if not user_credit:
                # Create new user credit record with free trial
                user_credit = UserCredit(
                    user_id=user_id,
                    initial_balance=50,  # Free trial credits
                    monthly_quota=0,     # No monthly quota for free trial
                    subscription_status='free_trial'
                )
                db.session.add(user_credit)
                
                # Log initial credits transaction
                transaction = CreditTransaction.create_initial_transaction(
                    user_id=user_id,
                    amount=50,
                    balance_after=50
                )
                db.session.add(transaction)
                
                db.session.commit()
                logger.info(f"Created new credit account for user {user_id} with 50 trial credits")
                
            return user_credit
            
        except SQLAlchemyError as e:
            logger.error(f"Database error creating user credits: {e}")
            db.session.rollback()
            raise
        except Exception as e:
            logger.error(f"Error getting/creating user credits: {e}")
            db.session.rollback()
            raise

    @staticmethod
    def check_balance(user_id: str) -> Dict[str, Any]:
        """
        Get user's current credit balance and related information.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with balance information
        """
        try:
            user_credit = CreditService.get_or_create_user_credits(user_id)
            
            # Check if renewal is due
            is_renewal_due = user_credit.is_renewal_due()
            if is_renewal_due and user_credit.subscription_status == 'active':
                CreditService._process_monthly_renewal(user_credit)
                
            return user_credit.to_dict()
            
        except Exception as e:
            logger.error(f"Error checking balance for user {user_id}: {e}")
            raise

    @staticmethod
    def check_sufficient_credits(user_id: str, required_amount: int) -> tuple[bool, Dict[str, Any]]:
        """
        Check if user has sufficient credits for an operation.
        
        Args:
            user_id: User ID
            required_amount: Credits required
            
        Returns:
            Tuple of (has_sufficient, balance_info)
        """
        try:
            balance_info = CreditService.check_balance(user_id)
            has_sufficient = balance_info['balance'] >= required_amount
            
            return has_sufficient, balance_info
            
        except Exception as e:
            logger.error(f"Error checking sufficient credits for user {user_id}: {e}")
            return False, {'balance': 0, 'error': str(e)}

    @staticmethod
    def deduct_credits(user_id: str, cost: int, tool_slug: str, interaction_id: Optional[str] = None) -> bool:
        """
        Deduct credits from user's balance after successful tool execution.
        
        Args:
            user_id: User ID
            cost: Credits to deduct
            tool_slug: Tool identifier
            interaction_id: Related interaction ID
            
        Returns:
            True if deduction successful, False otherwise
        """
        if cost <= 0:
            logger.debug(f"Tool {tool_slug} is free (cost: {cost}), skipping credit deduction")
            return True  # Free tools don't require deduction
            
        try:
            logger.info(f"Starting credit deduction: {cost} credits for user {user_id}, tool {tool_slug}")
            user_credit = CreditService.get_or_create_user_credits(user_id)
            
            # Verify user still has sufficient credits (double-check)
            if not user_credit.has_sufficient_credits(cost):
                logger.warning(f"Insufficient credits for user {user_id}: has {user_credit.balance}, needs {cost}")
                return False
                
            # Deduct credits
            success = user_credit.deduct_credits(cost)
            if not success:
                return False
                
            # Log transaction
            transaction = CreditTransaction.create_spent_transaction(
                user_id=user_id,
                amount=cost,
                balance_after=user_credit.balance,
                tool_slug=tool_slug,
                interaction_id=interaction_id
            )
            db.session.add(transaction)
            
            db.session.commit()
            logger.info(f"Deducted {cost} credits from user {user_id} for {tool_slug}. Balance: {user_credit.balance}")
            return True
            
        except SQLAlchemyError as e:
            logger.error(f"Database error deducting credits: {e}")
            db.session.rollback()
            return False
        except Exception as e:
            logger.error(f"Error deducting credits for user {user_id}: {e}")
            db.session.rollback()
            return False

    @staticmethod
    def add_credits(user_id: str, amount: int, reason: str) -> bool:
        """
        Add credits to user's balance.
        
        Args:
            user_id: User ID
            amount: Credits to add
            reason: Reason for adding credits
            
        Returns:
            True if successful, False otherwise
        """
        if amount <= 0:
            return False
            
        try:
            user_credit = CreditService.get_or_create_user_credits(user_id)
            user_credit.add_credits(amount)
            
            # Log transaction
            transaction = CreditTransaction.create_earned_transaction(
                user_id=user_id,
                amount=amount,
                balance_after=user_credit.balance,
                reason=reason
            )
            db.session.add(transaction)
            
            db.session.commit()
            logger.info(f"Added {amount} credits to user {user_id}: {reason}. Balance: {user_credit.balance}")
            return True
            
        except SQLAlchemyError as e:
            logger.error(f"Database error adding credits: {e}")
            db.session.rollback()
            return False
        except Exception as e:
            logger.error(f"Error adding credits for user {user_id}: {e}")
            db.session.rollback()
            return False

    @staticmethod
    def get_transaction_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get user's credit transaction history.
        
        Args:
            user_id: User ID
            limit: Maximum number of transactions to return
            
        Returns:
            List of transaction dictionaries
        """
        try:
            transactions = CreditTransaction.query.filter_by(user_id=user_id)\
                                                 .order_by(CreditTransaction.created_at.desc())\
                                                 .limit(limit)\
                                                 .all()
                                                 
            return [transaction.to_dict() for transaction in transactions]
            
        except Exception as e:
            logger.error(f"Error getting transaction history for user {user_id}: {e}")
            return []

    @staticmethod
    def get_tool_cost(tool_slug: str) -> int:
        """Get the credit cost for a specific tool from its class constant."""
        try:
            class_path = CreditService.TOOL_CLASS_MAPPING.get(tool_slug)
            if not class_path:
                logger.warning(f"Unknown tool slug: {tool_slug}")
                return 0  # Free for unknown tools
                
            # Parse module and class name
            module_path, class_name = class_path.rsplit('.', 1)
            
            # Import the module and get the class
            module = importlib.import_module(module_path)
            tool_class = getattr(module, class_name)
            
            # Get COST constant
            cost = getattr(tool_class, 'COST', 0)
            logger.debug(f"Tool {tool_slug} cost: {cost} credits")
            return cost
            
        except Exception as e:
            logger.error(f"Error getting tool cost for {tool_slug}: {e}")
            return 0  # Default to free on error

    @staticmethod 
    def get_all_tool_costs() -> Dict[str, int]:
        """Get all active tool costs from class constants."""
        try:
            tool_costs = {}
            for tool_slug in CreditService.TOOL_CLASS_MAPPING.keys():
                cost = CreditService.get_tool_cost(tool_slug)
                tool_costs[tool_slug] = cost
            return tool_costs
            
        except Exception as e:
            logger.error(f"Error getting all tool costs: {e}")
            return {}

    @staticmethod
    def upgrade_user_subscription(user_id: str, monthly_quota: int) -> bool:
        """
        Upgrade user to paid subscription with monthly quota.
        
        Args:
            user_id: User ID
            monthly_quota: Monthly credit allowance
            
        Returns:
            True if successful, False otherwise
        """
        try:
            user_credit = CreditService.get_or_create_user_credits(user_id)
            
            # Update subscription
            user_credit.subscription_status = 'active'
            user_credit.monthly_quota = monthly_quota
            user_credit.balance = monthly_quota  # Set full quota
            user_credit.renewal_date = datetime.utcnow() + timedelta(days=30)
            
            # Log renewal transaction
            transaction = CreditTransaction.create_renewal_transaction(
                user_id=user_id,
                amount=monthly_quota,
                balance_after=user_credit.balance
            )
            db.session.add(transaction)
            
            db.session.commit()
            logger.info(f"Upgraded user {user_id} to subscription with {monthly_quota} monthly credits")
            return True
            
        except Exception as e:
            logger.error(f"Error upgrading subscription for user {user_id}: {e}")
            db.session.rollback()
            return False

    @staticmethod
    def _process_monthly_renewal(user_credit: UserCredit) -> bool:
        """Process monthly renewal for active subscription."""
        try:
            success = user_credit.process_monthly_renewal()
            if success:
                # Log renewal transaction
                transaction = CreditTransaction.create_renewal_transaction(
                    user_id=user_credit.user_id,
                    amount=user_credit.monthly_quota,
                    balance_after=user_credit.balance
                )
                db.session.add(transaction)
                db.session.commit()
                logger.info(f"Processed monthly renewal for user {user_credit.user_id}")
            return success
            
        except Exception as e:
            logger.error(f"Error processing renewal for user {user_credit.user_id}: {e}")
            db.session.rollback()
            return False