"""
StyleAnalyzerTool - A tool for analyzing writing style using OpenAI.
Analyzes writing samples to create comprehensive style cards with automatic language detection.
"""

from typing import Dict, Any, Optional, List
import json
import logging

from ...shared.tool_factory import SystemMessageTool
from ...shared.validators import BaseValidator, ValidationResult
from ....models.user_style import UserStyle
from .... import db

# Create logger for this module
logger = logging.getLogger('app.agents.writer_agent.style_analyzer')


class StyleAnalysisValidator(BaseValidator):
    """Custom validator for style analysis input parameters."""
    
    def __init__(self):
        self.field_name = "style_analysis_input"
    
    def validate(self, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate style analysis input."""
        result = ValidationResult(is_valid=True)
        
        logger.debug(f"StyleAnalysisValidator.validate() received parameters: {parameters}")
        logger.debug(f"StyleAnalysisValidator.validate() received context: {context}")
        
        if not isinstance(parameters, dict):
            result.add_error("Parameters must be a dictionary")
            return result
        
        # Required fields
        user_id = parameters.get('user_id')
        samples = parameters.get('samples')
        content_types = parameters.get('content_types', ['general'])
        
        # Debug: Log extracted values
        logger.debug(f"Extracted user_id: {user_id}")
        logger.debug(f"Extracted samples: {samples} (type: {type(samples)}, length: {len(samples) if samples else 'N/A'})")
        logger.debug(f"Extracted content_types: {content_types}")
        
        # Validate user_id
        if not user_id or not isinstance(user_id, str):
            result.add_error("'user_id' is required and must be a string")
        else:
            result.set_validated_value('user_id', user_id)
        
        # Validate samples
        if not samples or not isinstance(samples, list):
            result.add_error("'samples' is required and must be a list")
        else:
            valid_samples = []
            for i, sample in enumerate(samples):
                if isinstance(sample, str) and len(sample.strip()) >= 50:
                    valid_samples.append(sample.strip())
                elif isinstance(sample, str):
                    logger.debug(f"Sample {i+1} too short: {len(sample.strip())} characters")
            
            if len(valid_samples) == 0:
                result.add_error("At least one sample with minimum 50 characters is required")
            else:
                result.set_validated_value('samples', valid_samples)
                logger.debug(f"Valid samples count: {len(valid_samples)}")
        
        # Validate content_types
        if not isinstance(content_types, list) or len(content_types) == 0:
            result.add_error("'content_types' must be a non-empty list")
        else:
            valid_types = ['post', 'blog', 'script', 'general']
            filtered_types = [ct for ct in content_types if ct in valid_types]
            if not filtered_types:
                result.add_error(f"'content_types' must contain at least one of: {valid_types}")
            else:
                result.set_validated_value('content_types', filtered_types)
        
        # Optional banlist_seed
        banlist_seed = parameters.get('banlist_seed', [
            "dive into", "unlock potential", "game-changer", 
            "at the end of the day", "cutting-edge", "synergy"
        ])
        if not isinstance(banlist_seed, list):
            banlist_seed = []
        result.set_validated_value('banlist_seed', banlist_seed)
        
        logger.debug(f"Validation completed. is_valid: {result.is_valid}")
        logger.debug(f"Validation errors: {result.errors}")
        logger.debug(f"Validated data: {result.validated_data}")
        
        return result


class StyleAnalyzerTool(SystemMessageTool):
    """
    Tool for analyzing writing style using AI analysis.
    Creates comprehensive style cards with automatic language detection.
    """

    VERSION = '1.0.0'

    def __init__(self):
        # System message for style analysis (from the provided prompt template)
        system_message = """You are a precise writing-style analyst. Read the provided samples and produce a compact, actionable Style Card as JSON ONLY (no prose, no markdown). 

Rules:
- Output must be valid JSON exactly matching the provided schema keys.
- Values must be concise and specific (avoid generic words like "professional", "engaging").
- Infer numerical values (e.g., avg sentence length) from the samples; estimate if needed.
- AUTOMATICALLY DETECT the language of the samples and include it in the response.
- Build a realistic `negative_constraints` list by scanning the samples: 
  include clichés/AI-isms from the banlist_seed ONLY if they do NOT appear in the samples; 
  exclude anything the author actually uses.
- If evidence is insufficient for a field, choose the most conservative, non-fantastical default.
Return ONLY the JSON object."""

        # Initialize using factory pattern
        super().__init__(
            name='Style Analyzer',
            slug='analyze-style',
            description='Analyze writing samples to create comprehensive style cards with automatic language detection',
            system_message=system_message,
            version=self.VERSION,
            model="gpt-4o"
        )
        
        # Store custom validator for use in _validate_input
        self._custom_validator = StyleAnalysisValidator()

    def _validate_input(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Override to use custom validation logic."""
        logger.info(f"Validating style analysis input parameters: {parameters}")
        
        validation_result = self._custom_validator.validate(parameters)
        
        logger.info(f"Validation result: valid={validation_result.is_valid}, errors={validation_result.errors}")
        
        if not validation_result.is_valid:
            logger.error(f"Validation failed: {validation_result.get_error_message()}")
            return {
                'valid': False,
                'error': validation_result.get_error_message()
            }
        
        # Return validated data
        return validation_result.validated_data

    def _prepare_user_message(self, validated_params: Dict[str, Any]) -> str:
        """Prepare the user message for OpenAI with samples and requirements."""
        
        # Define the style card schema
        style_card_schema = {
            "language": "string",
            "domains": ["string"],
            "diction": {
                "register": "string",
                "lexicon": "string",
                "jargon_tolerance": "low|medium|high"
            },
            "syntax": {
                "avg_sentence_words": 0,
                "variance": "low|medium|high",
                "patterns": ["string"],
                "fragments_ok": True
            },
            "tone_voice": {
                "tone": ["string"],
                "persona": "string",
                "emotional_intensity": "low|medium|high"
            },
            "rhythm": {
                "burstiness": "low|medium|high",
                "avg_sentence_words": 0,
                "sentence_variance": "low|medium|high",
                "paragraph_len": "short|short-medium|medium|long",
                "intro_words_max": 0
            },
            "rhetoric": {
                "moves": ["string"],
                "evidence_style": "string"
            },
            "literary_devices": ["string"],
            "idiosyncrasies": ["string"],
            "formatting": {
                "headers": "string",
                "bullets": "never|sometimes|frequent"
            },
            "negative_constraints": ["string"],
            "script_specific": {
                "asides": "never|occasional|frequent",
                "stage_dirs": "minimal|moderate|detailed"
            },
            "version": "v1"
        }
        
        # Build samples block
        samples_block = "\n\n".join([
            f"[SAMPLE {i+1}]\n{text}" 
            for i, text in enumerate(validated_params['samples'])
        ])
        
        # Build user message
        user_message = f"""TASK:
Create a Style Card that captures the author's stable voice across the provided samples. 
Focus on: diction, syntax patterns, tone/voice, rhythm/burstiness, rhetorical moves, devices, idiosyncrasies, formatting, and a tailored negative-constraints ban list.

OUTPUT SCHEMA (fixed keys):
{json.dumps(style_card_schema, indent=2)}

CONTEXT:
content_types: {", ".join(validated_params['content_types'])}

BANLIST_SEED (phrases to consider banning if absent from samples):
{" | ".join(validated_params['banlist_seed'])}

SAMPLES (separate, cleaned excerpts; treat as authoritative):
---
{samples_block}
---

QUALITY CHECKS YOU MUST SELF-APPLY BEFORE RETURNING:
1) JSON is valid and uses only the schema keys.
2) Numbers are realistic: avg_sentence_words in [8..28]; intro_words_max in [30..120] unless clearly long-form.
3) `negative_constraints` contains only phrases NOT found in samples; remove anything the author actually uses.
4) Lists are non-empty and concrete (e.g., rhetorical moves like ["analogy","contrast","anecdote"]).
5) AUTOMATICALLY DETECT and include the correct language code in the "language" field.

Return ONLY the JSON object, nothing else."""
        
        return user_message

    def _post_process_response(self, raw_response: str, validated_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Post-process the AI response and save the style to database.
        
        Args:
            raw_response: Raw response from OpenAI
            validated_params: Validated input parameters
            
        Returns:
            Dict containing the processed result
        """
        try:
            # Parse the JSON response
            style_card = json.loads(raw_response)
            
            # Validate that required fields are present
            required_fields = [
                'language', 'domains', 'diction', 'syntax',
                'tone_voice', 'rhythm', 'rhetoric', 'literary_devices',
                'idiosyncrasies', 'formatting', 'negative_constraints',
                'script_specific'
            ]
            
            missing_fields = [field for field in required_fields if field not in style_card]
            if missing_fields:
                logger.warning(f"Missing fields in style card: {missing_fields}")
            
            # Ensure version is set
            style_card['version'] = 'v1'
            
            # Save the style to database
            try:
                user_style = UserStyle(
                    user_id=validated_params['user_id'],
                    language=style_card.get('language', 'unknown'),
                    style_card=style_card
                )
                db.session.add(user_style)
                db.session.commit()
                
                logger.info(f"Style analysis saved successfully for user: {validated_params['user_id']}")
                
                return {
                    'success': True,
                    'style_id': user_style.id,
                    'style_card': style_card,
                    'message': 'Style analysis completed successfully'
                }
                
            except Exception as db_error:
                db.session.rollback()
                logger.error(f"Failed to save style analysis to database: {str(db_error)}")
                return {
                    'success': False,
                    'error': f'Failed to save style analysis: {str(db_error)}',
                    'style_card': style_card  # Still return the analysis
                }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response as JSON: {e}")
            logger.error(f"Raw response: {raw_response}")
            return {
                'success': False,
                'error': 'Invalid JSON response from AI analysis',
                'raw_response': raw_response
            }
        except Exception as e:
            logger.error(f"Unexpected error in post-processing: {str(e)}")
            return {
                'success': False,
                'error': f'Processing error: {str(e)}'
            }