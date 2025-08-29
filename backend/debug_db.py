#!/usr/bin/env python3
"""
Debug database content
"""

from app import create_app
from app.models.user import User
from app.models.business_profile import BusinessProfile
from app.models.competition import Competition

def debug_database():
    """Debug database content"""
    print("🔍 Debugging Database Content...")
    print("=" * 50)

    app = create_app()

    with app.app_context():
        # Check users
        users = User.query.all()
        print(f"👥 Users: {len(users)}")
        for user in users:
            print(f"   - {user.email} (ID: {user.id})")

        # Check business profiles
        profiles = BusinessProfile.query.all()
        print(f"\n🏢 Business Profiles: {len(profiles)}")
        for profile in profiles:
            print(f"   - {profile.name} (ID: {profile.id}, User: {profile.user_id})")
            print(f"     Website: {profile.website_url}")
            print(f"     Created: {profile.created_at}")

        # Check competitions
        competitions = Competition.query.all()
        print(f"\n🏆 Competitions: {len(competitions)}")
        for comp in competitions:
            print(f"   - {comp.name} (ID: {comp.id}, Profile: {comp.business_profile_id})")
            print(f"     URL: {comp.url}")

if __name__ == "__main__":
    debug_database()
