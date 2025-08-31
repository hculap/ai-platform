import pytest
import json
from unittest.mock import patch, MagicMock, AsyncMock
from app import db
from app.models.offer import Offer
from app.agents.base import AgentInput, AgentOutput
from app.agents.offer_assistant.tools.generateOffersTool import GenerateOffersTool
from app.services.offer_service import OfferService


class TestGenerateOffersTool:
    """Test suite for GenerateOffersTool"""
    
    @pytest.fixture
    def tool(self):
        """Create GenerateOffersTool instance"""
        return GenerateOffersTool()
    
    @pytest.fixture
    def agent_input(self, test_business_profile):
        """Create AgentInput for testing"""
        return AgentInput(
            agent_type='offer-assistant',
            parameters={'business_profile_id': test_business_profile.id},
            business_profile_id=test_business_profile.id,
            user_id=test_business_profile.user_id
        )
    
    def test_generate_offers_tool_initialization(self, tool):
        """Test tool initialization"""
        assert tool.name == 'generate_offers'
        assert tool.description == 'Generate offers for a business profile using AI analysis'
        assert hasattr(tool, 'execute')
    
    @patch('app.agents.offer_assistant.tools.generateOffersTool.OfferService')
    @pytest.mark.asyncio
    async def test_execute_success(self, mock_offer_service, tool, agent_input, app):
        """Test successful tool execution"""
        with app.app_context():
            # Mock OfferService
            mock_service_instance = MagicMock()
            mock_service_instance.generate_offers_for_business_profile = AsyncMock(
                return_value={'offers_generated': 3, 'offers': ['offer1', 'offer2', 'offer3']}
            )
            mock_offer_service.return_value = mock_service_instance
            
            # Execute tool
            result = await tool.execute(agent_input)
            
            # Verify result
            assert isinstance(result, AgentOutput)
            assert result.success == True
            assert 'offers_generated' in result.data
            assert result.data['offers_generated'] == 3
            
            # Verify service was called correctly
            mock_offer_service.assert_called_once()
            mock_service_instance.generate_offers_for_business_profile.assert_called_once_with(
                agent_input.business_profile_id
            )
    
    @patch('app.agents.offer_assistant.tools.generateOffersTool.OfferService')
    @pytest.mark.asyncio
    async def test_execute_service_failure(self, mock_offer_service, tool, agent_input, app):
        """Test tool execution when service fails"""
        with app.app_context():
            # Mock OfferService to raise exception
            mock_service_instance = MagicMock()
            mock_service_instance.generate_offers_for_business_profile = AsyncMock(
                side_effect=Exception('Service failed')
            )
            mock_offer_service.return_value = mock_service_instance
            
            # Execute tool
            result = await tool.execute(agent_input)
            
            # Verify result
            assert isinstance(result, AgentOutput)
            assert result.success == False
            assert 'Service failed' in result.error
    
    @pytest.mark.asyncio
    async def test_execute_missing_business_profile_id(self, tool, app):
        """Test tool execution with missing business profile ID"""
        with app.app_context():
            # Create agent input without business_profile_id
            invalid_input = AgentInput(
                agent_type='offer-assistant',
                parameters={},
                business_profile_id=None,
                user_id='test-user-id'
            )
            
            # Execute tool
            result = await tool.execute(invalid_input)
            
            # Verify result
            assert isinstance(result, AgentOutput)
            assert result.success == False
            assert 'business_profile_id is required' in result.error


class TestOfferService:
    """Test suite for OfferService"""
    
    @pytest.fixture
    def offer_service(self):
        """Create OfferService instance"""
        return OfferService()
    
    @patch('app.services.offer_service.OpenAIClient')
    @pytest.mark.asyncio
    async def test_generate_offers_for_business_profile_success(self, mock_openai_client, offer_service, app, test_business_profile):
        """Test successful offer generation"""
        with app.app_context():
            # Mock OpenAI response
            mock_openai_response = {
                'offers': [
                    {
                        'type': 'product',
                        'name': 'Premium Widget',
                        'description': 'High-quality widget for professionals',
                        'unit': 'piece',
                        'price': 99.99,
                        'status': 'draft'
                    },
                    {
                        'type': 'service',
                        'name': 'Widget Installation',
                        'description': 'Professional widget installation service',
                        'unit': 'hour',
                        'price': 75.00,
                        'status': 'draft'
                    }
                ]
            }
            
            mock_client_instance = MagicMock()
            mock_client_instance.generate_offers = AsyncMock(return_value=mock_openai_response)
            mock_openai_client.return_value = mock_client_instance
            
            # Execute service
            result = await offer_service.generate_offers_for_business_profile(test_business_profile.id)
            
            # Verify result
            assert 'offers_generated' in result
            assert result['offers_generated'] == 2
            assert 'offers' in result
            assert len(result['offers']) == 2
            
            # Verify offers were created in database
            offers = Offer.query.filter_by(business_profile_id=test_business_profile.id).all()
            assert len(offers) == 2
            
            # Check first offer
            widget_offer = next((o for o in offers if o.name == 'Premium Widget'), None)
            assert widget_offer is not None
            assert widget_offer.type == 'product'
            assert widget_offer.unit == 'piece'
            assert float(widget_offer.price) == 99.99
            
            # Check second offer
            service_offer = next((o for o in offers if o.name == 'Widget Installation'), None)
            assert service_offer is not None
            assert service_offer.type == 'service'
            assert service_offer.unit == 'hour'
            assert float(service_offer.price) == 75.00
    
    @patch('app.services.offer_service.OpenAIClient')
    @pytest.mark.asyncio
    async def test_generate_offers_openai_failure(self, mock_openai_client, offer_service, app, test_business_profile):
        """Test offer generation when OpenAI fails"""
        with app.app_context():
            # Mock OpenAI to raise exception
            mock_client_instance = MagicMock()
            mock_client_instance.generate_offers = AsyncMock(side_effect=Exception('OpenAI API failed'))
            mock_openai_client.return_value = mock_client_instance
            
            # Execute service and expect exception
            with pytest.raises(Exception) as exc_info:
                await offer_service.generate_offers_for_business_profile(test_business_profile.id)
            
            assert 'OpenAI API failed' in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_generate_offers_business_profile_not_found(self, offer_service, app):
        """Test offer generation with non-existent business profile"""
        with app.app_context():
            with pytest.raises(Exception) as exc_info:
                await offer_service.generate_offers_for_business_profile('non-existent-id')
            
            assert 'Business profile not found' in str(exc_info.value)
    
    @patch('app.services.offer_service.OpenAIClient')
    @pytest.mark.asyncio
    async def test_generate_offers_invalid_response_format(self, mock_openai_client, offer_service, app, test_business_profile):
        """Test offer generation with invalid OpenAI response format"""
        with app.app_context():
            # Mock OpenAI response with invalid format
            mock_openai_response = {
                'invalid': 'response format'
            }
            
            mock_client_instance = MagicMock()
            mock_client_instance.generate_offers = AsyncMock(return_value=mock_openai_response)
            mock_openai_client.return_value = mock_client_instance
            
            # Execute service and expect it to handle gracefully
            with pytest.raises(Exception) as exc_info:
                await offer_service.generate_offers_for_business_profile(test_business_profile.id)
            
            assert 'Invalid response format' in str(exc_info.value) or 'offers' in str(exc_info.value).lower()
    
    @patch('app.services.offer_service.OpenAIClient')
    @pytest.mark.asyncio
    async def test_generate_offers_with_existing_offers(self, mock_openai_client, offer_service, app, test_business_profile, test_offer):
        """Test offer generation when offers already exist"""
        with app.app_context():
            # Mock OpenAI response
            mock_openai_response = {
                'offers': [
                    {
                        'type': 'service',
                        'name': 'New Service',
                        'description': 'A new service offering',
                        'unit': 'hour',
                        'price': 120.00,
                        'status': 'draft'
                    }
                ]
            }
            
            mock_client_instance = MagicMock()
            mock_client_instance.generate_offers = AsyncMock(return_value=mock_openai_response)
            mock_openai_client.return_value = mock_client_instance
            
            # Execute service
            result = await offer_service.generate_offers_for_business_profile(test_business_profile.id)
            
            # Verify result
            assert result['offers_generated'] == 1
            
            # Verify total offers in database (existing + new)
            offers = Offer.query.filter_by(business_profile_id=test_business_profile.id).all()
            assert len(offers) == 2  # 1 existing + 1 new
    
    @patch('app.services.offer_service.OpenAIClient')
    @pytest.mark.asyncio
    async def test_generate_offers_database_error(self, mock_openai_client, offer_service, app, test_business_profile):
        """Test offer generation when database operations fail"""
        with app.app_context():
            # Mock OpenAI response
            mock_openai_response = {
                'offers': [
                    {
                        'type': 'product',
                        'name': 'Test Product',
                        'description': 'Test description',
                        'unit': 'piece',
                        'price': 50.00,
                        'status': 'draft'
                    }
                ]
            }
            
            mock_client_instance = MagicMock()
            mock_client_instance.generate_offers = AsyncMock(return_value=mock_openai_response)
            mock_openai_client.return_value = mock_client_instance
            
            # Mock database session to fail on commit
            with patch.object(db.session, 'commit') as mock_commit:
                mock_commit.side_effect = Exception('Database error')
                
                # Execute service and expect exception
                with pytest.raises(Exception) as exc_info:
                    await offer_service.generate_offers_for_business_profile(test_business_profile.id)
                
                assert 'Database error' in str(exc_info.value)
    
    def test_offer_service_initialization(self, offer_service):
        """Test OfferService initialization"""
        assert hasattr(offer_service, 'generate_offers_for_business_profile')
        assert callable(offer_service.generate_offers_for_business_profile)
    
    @patch('app.services.offer_service.OpenAIClient')
    @pytest.mark.asyncio
    async def test_generate_offers_empty_response(self, mock_openai_client, offer_service, app, test_business_profile):
        """Test offer generation with empty OpenAI response"""
        with app.app_context():
            # Mock OpenAI response with empty offers array
            mock_openai_response = {
                'offers': []
            }
            
            mock_client_instance = MagicMock()
            mock_client_instance.generate_offers = AsyncMock(return_value=mock_openai_response)
            mock_openai_client.return_value = mock_client_instance
            
            # Execute service
            result = await offer_service.generate_offers_for_business_profile(test_business_profile.id)
            
            # Verify result
            assert result['offers_generated'] == 0
            assert result['offers'] == []
            
            # Verify no new offers in database
            offers = Offer.query.filter_by(business_profile_id=test_business_profile.id).all()
            assert len(offers) == 0