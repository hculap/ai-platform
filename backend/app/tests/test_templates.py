import pytest
import json
from app import create_app, db
from app.models.prompt_template import PromptTemplate
from app.models.user import User

@pytest.fixture
def app():
    """Create and configure a test app."""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    """Create a test user and return auth headers."""
    # Register a test user
    response = client.post('/api/auth/register',
                          json={'email': 'test@test.com', 'password': 'TestPass123'})
    assert response.status_code == 201

    data = response.get_json()
    token = data['access_token']

    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def sample_template_id(app):
    """Create a sample template for testing and return its ID."""
    with app.app_context():
        template = PromptTemplate(
            title="Test Template",
            description="A test template for testing",
            content="Hello {{business_profile.name}}, your target is {{business_profile.target_customer}}",
            category="Sales",
            dependencies=["business_profile"],
            language="en",
            status="active"
        )
        db.session.add(template)
        db.session.commit()
        return template.id

class TestPromptTemplateModel:
    """Test the PromptTemplate model."""

    def test_create_template(self, app):
        """Test creating a template."""
        with app.app_context():
            template = PromptTemplate(
                title="Test Template",
                description="Test description",
                content="Test content",
                category="Sales",
                dependencies=["business_profile"],
                language="en"
            )
            db.session.add(template)
            db.session.commit()

            assert template.id is not None
            assert template.title == "Test Template"
            assert template.dependencies == ["business_profile"]
            assert template.language == "en"
            assert template.status == "active"  # default value

    def test_to_dict(self, app, sample_template_id):
        """Test template serialization."""
        with app.app_context():
            template = db.session.get(PromptTemplate, sample_template_id)
            template_dict = template.to_dict()

            assert template_dict['title'] == "Test Template"
            assert template_dict['category'] == "Sales"
            assert template_dict['dependencies'] == ["business_profile"]
            assert template_dict['language'] == "en"
            assert template_dict['status'] == "active"

    def test_get_active_templates(self, app):
        """Test getting active templates."""
        with app.app_context():
            # Create active template
            active_template = PromptTemplate(
                title="Active Template",
                content="Active content",
                category="Sales",
                language="en",
                status="active"
            )

            # Create inactive template
            inactive_template = PromptTemplate(
                title="Inactive Template",
                content="Inactive content",
                category="Sales",
                language="en",
                status="inactive"
            )

            db.session.add(active_template)
            db.session.add(inactive_template)
            db.session.commit()

            active_templates = PromptTemplate.get_active_templates(language="en")
            assert len(active_templates) == 1
            assert active_templates[0].title == "Active Template"

    def test_get_categories(self, app):
        """Test getting template categories."""
        with app.app_context():
            # Create templates with different categories
            template1 = PromptTemplate(
                title="Sales Template",
                content="Sales content",
                category="Sales",
                language="en"
            )

            template2 = PromptTemplate(
                title="Marketing Template",
                content="Marketing content",
                category="Marketing",
                language="en"
            )

            db.session.add(template1)
            db.session.add(template2)
            db.session.commit()

            categories = PromptTemplate.get_categories(language="en")
            assert "Sales" in categories
            assert "Marketing" in categories
            assert len(categories) == 2

class TestTemplateAPI:
    """Test the template API endpoints."""

    def test_get_templates_success(self, client, auth_headers, sample_template_id):
        """Test successful template retrieval."""
        response = client.get('/api/templates/', headers=auth_headers)

        assert response.status_code == 200
        data = response.get_json()

        assert 'templates' in data
        assert 'count' in data
        assert data['count'] == 1
        assert len(data['templates']) == 1

        template = data['templates'][0]
        assert template['title'] == "Test Template"
        assert template['category'] == "Sales"

    def test_get_templates_unauthorized(self, client, sample_template_id):
        """Test template retrieval without authentication."""
        response = client.get('/api/templates/')
        assert response.status_code == 401

    def test_get_templates_with_filters(self, client, auth_headers, app):
        """Test template retrieval with filters."""
        with app.app_context():
            # Create templates with different categories and languages
            template1 = PromptTemplate(
                title="Sales Template EN",
                content="Sales content",
                category="Sales",
                language="en"
            )

            template2 = PromptTemplate(
                title="Marketing Template EN",
                content="Marketing content",
                category="Marketing",
                language="en"
            )

            template3 = PromptTemplate(
                title="Sales Template PL",
                content="Sales content",
                category="Sales",
                language="pl"
            )

            db.session.add(template1)
            db.session.add(template2)
            db.session.add(template3)
            db.session.commit()

        # Test category filter
        response = client.get('/api/templates/?category=Sales', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['count'] == 1  # Only EN Sales template (default language)

        # Test language filter
        response = client.get('/api/templates/?language=pl', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['count'] == 1  # Only PL template

        # Test search filter
        response = client.get('/api/templates/?search=Marketing', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['count'] == 1  # Only Marketing template

    def test_get_single_template(self, client, auth_headers, sample_template_id):
        """Test retrieving a single template."""
        response = client.get(f'/api/templates/{sample_template_id}', headers=auth_headers)

        assert response.status_code == 200
        data = response.get_json()

        assert data['title'] == "Test Template"
        assert data['category'] == "Sales"
        assert data['id'] == sample_template_id

    def test_get_single_template_not_found(self, client, auth_headers):
        """Test retrieving a non-existent template."""
        response = client.get('/api/templates/non-existent-id', headers=auth_headers)
        assert response.status_code == 404

    def test_get_categories_success(self, client, auth_headers, sample_template_id):
        """Test successful categories retrieval."""
        response = client.get('/api/templates/categories', headers=auth_headers)

        assert response.status_code == 200
        data = response.get_json()

        assert 'categories' in data
        assert 'count' in data
        assert "Sales" in data['categories']

    def test_get_categories_unauthorized(self, client):
        """Test categories retrieval without authentication."""
        response = client.get('/api/templates/categories')
        assert response.status_code == 401