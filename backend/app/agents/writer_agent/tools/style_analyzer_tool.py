"""
StyleAnalyzerTool - A tool for analyzing writing style using OpenAI.
Analyzes writing samples to create comprehensive style cards with automatic language detection.
"""

from typing import Dict, Any, Optional, List
import json
import logging
import re

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
        
        # Required fields (user_id comes from JWT, not from parameters)
        samples = parameters.get('samples')
        content_types = parameters.get('content_types', ['general'])
        business_profile_id = parameters.get('business_profile_id')  # Optional
        
        # Debug: Log extracted values
        logger.debug(f"Extracted samples: {samples} (type: {type(samples)}, length: {len(samples) if samples else 'N/A'})")
        logger.debug(f"Extracted content_types: {content_types}")
        logger.debug(f"Extracted business_profile_id: {business_profile_id}")
        
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
        
        # Language-specific default blacklists
        DEFAULT_BLACKLISTS = {
            'en': [
                "across", "additionally", "moreover", "furthermore", "notably", 
                "particularly", "within", "overall", "in essence", "comprehensive", 
                "crucial", "pivotal", "robust", "holistic", "nuanced", "meticulous", 
                "innovative", "commendable", "versatile", "transformative", "realm", 
                "landscape", "framework", "paradigm", "tapestry", "insights", 
                "findings", "potential", "underscore", "underscores", "underscored", 
                "underscoring", "delve", "delves", "delved", "delving", "showcase", 
                "showcases", "showcased", "showcasing", "leverage", "leverages", 
                "leveraged", "leveraging", "enhance", "enhances", "enhanced", 
                "enhancing", "facilitate", "facilitates", "facilitated", 
                "facilitating", "navigate", "navigates", "navigated", "navigating"
            ],
            'pl': [
                "ponadto", "dodatkowo", "co więcej", "co istotne", "warto zauważyć", 
                "w szczególności", "zwłaszcza", "w ramach", "w obrębie", "w zakresie", 
                "na przestrzeni", "ogólnie rzecz biorąc", "podsumowując", "kompleksowy", 
                "wyczerpujący", "przekrojowy", "kluczowy", "istotny", "przełomowy", 
                "złożony", "skrupulatny", "holistyczny", "obszar", "dziedzina", 
                "krajobraz", "ramy", "paradygmat", "perspektywa", "zakres", "wnioski", 
                "spostrzeżenia", "wglądy", "wdrożenie", "optymalizacja", "synergia", 
                "podkreśla", "uwypukla", "wykazano", "wykazuje", "zaobserwowano", 
                "odnotowano", "prezentuje", "ukazuje", "zagłębiać się", "wgłębiać się", 
                "w dobie", "w erze", "na styku", "dlatego też", "tym samym", 
                "w rezultacie", "zatem", "może", "potencjalnie", "prawdopodobnie", 
                "wydaje się"
            ]
        }
        
        # Try to detect language from samples or use fallback
        detected_language = 'en'  # Default fallback
        if samples and isinstance(samples, list) and len(samples) > 0:
            # Simple language detection based on character patterns
            sample_text = ' '.join([str(s) for s in samples]).lower()
            polish_indicators = ['ą', 'ę', 'ć', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż', 'się', 'nie', 'jest', 'że']
            polish_score = sum(1 for indicator in polish_indicators if indicator in sample_text)
            if polish_score >= 3:  # If we find enough Polish indicators
                detected_language = 'pl'
        
        # Optional banlist_seed with language-specific defaults
        banlist_seed = parameters.get('banlist_seed', DEFAULT_BLACKLISTS.get(detected_language, DEFAULT_BLACKLISTS['en']))
        if not isinstance(banlist_seed, list):
            banlist_seed = []
        result.set_validated_value('banlist_seed', banlist_seed)
        
        # Optional style_name
        style_name = parameters.get('style_name')
        if style_name is not None and isinstance(style_name, str) and len(style_name.strip()) > 0:
            result.set_validated_value('style_name', style_name.strip())
        else:
            result.set_validated_value('style_name', None)
        
        # Optional business_profile_id - preserve it in validated result
        result.set_validated_value('business_profile_id', business_profile_id)
        
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
        # System message for style analysis with executable directive generation
        system_message = """You are a precise writing-style analyst creating EXECUTABLE style cards. Read the provided samples and produce an actionable Style Card as RAW JSON ONLY.

CRITICAL FORMATTING RULES:
- Return ONLY raw JSON - NO markdown code blocks, NO ```json``` wrappers, NO backticks
- Start your response directly with { and end with }
- NO additional text, explanations, or formatting outside the JSON
- Output must be valid JSON exactly matching the provided schema keys

ANALYSIS RULES:
- Values must be concise and specific (avoid generic words like "professional", "engaging")
- Infer numerical values (e.g., avg sentence length) from the samples; estimate if needed
- AUTOMATICALLY DETECT the language of the samples and include it in the response
- PRESERVE the content_types from the input parameters exactly as provided in the analysis request
- Build a realistic `negative_constraints` list by scanning the samples: 
  include clichés/AI-isms from the banlist_seed ONLY if they do NOT appear in the samples; 
  exclude anything the author actually uses
- If evidence is insufficient for a field, choose the most conservative, non-fantastical default

EXECUTABLE DIRECTIVES RULES:
- `rewrite_directives`: Create 3-5 short, direct commands for LLMs (e.g., "Keep sentences 10-16 words", "Use em-dashes for emphasis", "Allow sentence fragments occasionally")
- `lexical_anchors`: Extract 10-15 characteristic phrases, word patterns, or stylistic markers the author actually uses
- `prohibitions`: Merge negative_constraints with author's specific anti-patterns (things they clearly avoid)
- `format_rules`: Concrete formatting instructions (e.g., "No headers unless requested", "Use bullets for 3+ items only", "1-2 paragraphs per 120 words")
- `execution_targets`: Specific numeric ranges for consistency (e.g., "12-18 words", "80-120 words", "informal-conversational")

EXAMPLE OUTPUT FORMAT:
{"language": "en", "content_types": ["post", "blog"], "domains": ["business"], "diction": {...}, "rewrite_directives": ["Keep sentences under 20 words", "Use active voice"], ...}

Return ONLY the raw JSON object - no other text or formatting."""

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
        
        # Return validated data with valid flag
        result = {'valid': True}
        result.update(validation_result.validated_data)
        return result

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
            "rewrite_directives": ["string"],
            "lexical_anchors": ["string"],
            "prohibitions": ["string"],
            "format_rules": ["string"],
            "execution_targets": {
                "sentence_length_range": "string",
                "paragraph_word_count": "string",
                "tone_consistency": "string"
            },
            "version": "v2"
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

    def _process_openai_result(
        self,
        content: Any,
        validated_params: Dict[str, Any],
        openai_result: Dict[str, Any],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Process OpenAI result and save style to database."""
        try:
            # Call the custom post-processing method with the real user_id from JWT
            result = self._post_process_response(content, validated_params, user_id)
            return result
        except Exception as e:
            logger.error(f"Failed to process OpenAI result: {str(e)}")
            return {
                'success': False,
                'error': f'Processing error: {str(e)}'
            }

    def _extract_json_from_response(self, raw_response: str) -> dict:
        """
        Extract JSON from potentially markdown-wrapped response.
        
        Args:
            raw_response: Raw response from OpenAI which may contain markdown
            
        Returns:
            dict: Parsed JSON object
            
        Raises:
            json.JSONDecodeError: If no valid JSON can be extracted
        """
        logger.debug(f"Attempting to extract JSON from response: {raw_response[:200]}...")
        
        # Try direct JSON parsing first (for clean responses)
        try:
            parsed = json.loads(raw_response)
            logger.debug("Successfully parsed response as direct JSON")
            return parsed
        except json.JSONDecodeError:
            logger.debug("Direct JSON parsing failed, trying markdown extraction")
        
        # Extract JSON from markdown code blocks
        patterns = [
            # Standard markdown JSON block
            r'```json\s*\n(.*?)\n```',
            # Generic code block 
            r'```\s*\n(.*?)\n```',
            # JSON object anywhere in the text (improved pattern for nested structures)
            r'(\{(?:[^{}]|(?:\{[^{}]*\}))*\})'
        ]
        
        for i, pattern in enumerate(patterns):
            logger.debug(f"Trying extraction pattern {i+1}: {pattern}")
            match = re.search(pattern, raw_response, re.DOTALL | re.MULTILINE)
            if match:
                json_text = match.group(1).strip()
                logger.debug(f"Found potential JSON: {json_text[:100]}...")
                try:
                    parsed = json.loads(json_text)
                    logger.debug(f"Successfully extracted JSON using pattern {i+1}")
                    return parsed
                except json.JSONDecodeError as e:
                    logger.debug(f"Pattern {i+1} extraction failed: {e}")
                    continue
        
        # If all patterns fail, log the response and raise error
        logger.error(f"Failed to extract JSON from response. Raw response: {raw_response}")
        raise json.JSONDecodeError("No valid JSON found in response", raw_response, 0)

    def _post_process_response(self, raw_response: str, validated_params: Dict[str, Any], user_id: Optional[str]) -> Dict[str, Any]:
        """
        Post-process the AI response and save the style to database.
        
        Args:
            raw_response: Raw response from OpenAI
            validated_params: Validated input parameters
            user_id: Real user ID from JWT authentication
            
        Returns:
            Dict containing the processed result
        """
        try:
            # Extract and parse the JSON response (handles markdown wrapping)
            style_card = self._extract_json_from_response(raw_response)
            
            # Ensure content_types are preserved from user input
            content_types = validated_params.get('content_types', ['general'])
            if 'content_types' not in style_card or not style_card['content_types']:
                logger.debug(f"Adding missing content_types to style card: {content_types}")
                style_card['content_types'] = content_types
            else:
                logger.debug(f"Style card already contains content_types: {style_card['content_types']}")
            
            # Validate that required fields are present
            required_fields = [
                'language', 'domains', 'diction', 'syntax',
                'tone_voice', 'rhythm', 'rhetoric', 'literary_devices',
                'idiosyncrasies', 'formatting', 'negative_constraints',
                'script_specific', 'rewrite_directives', 'lexical_anchors',
                'prohibitions', 'format_rules', 'execution_targets'
            ]
            
            missing_fields = [field for field in required_fields if field not in style_card]
            if missing_fields:
                logger.warning(f"Missing fields in style card: {missing_fields}")
            
            # Ensure version is set
            style_card['version'] = 'v2'
            
            # Save the style to database
            try:
                # Use the real user_id from JWT, fallback to validated params if not provided
                actual_user_id = user_id or validated_params.get('user_id', 'unknown')
                
                # Extract sample texts from validated params
                sample_texts = validated_params.get('samples', [])
                
                # Generate a default style name based on language and content type
                content_types = validated_params.get('content_types', ['general'])
                default_name = f"{style_card.get('language', 'unknown').title()} {content_types[0].title()} Style"
                
                user_style = UserStyle(
                    user_id=actual_user_id,
                    language=style_card.get('language', 'unknown'),
                    style_card=style_card,
                    style_name=validated_params.get('style_name', default_name),
                    sample_texts=sample_texts,
                    business_profile_id=validated_params.get('business_profile_id')
                )
                db.session.add(user_style)
                db.session.commit()
                
                logger.info(f"Style analysis saved successfully for user: {actual_user_id}")
                
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
            logger.error(f"Failed to extract JSON from OpenAI response: {e}")
            logger.error(f"Raw response length: {len(raw_response)} characters")
            logger.error(f"Raw response preview: {raw_response[:500]}...")
            
            # Try to extract any partial JSON data for debugging
            partial_data = {}
            try:
                # Look for individual field patterns as fallback
                if 'language' in raw_response:
                    lang_match = re.search(r'"language":\s*"([^"]+)"', raw_response)
                    if lang_match:
                        partial_data['language'] = lang_match.group(1)
                        
                if 'negative_constraints' in raw_response:
                    constraints_match = re.search(r'"negative_constraints":\s*\[(.*?)\]', raw_response)
                    if constraints_match:
                        partial_data['detected_constraints'] = constraints_match.group(1)
                        
                logger.info(f"Extracted partial data for debugging: {partial_data}")
            except Exception as partial_error:
                logger.debug(f"Could not extract partial data: {partial_error}")
            
            return {
                'success': False,
                'error': 'Invalid JSON response from AI analysis - could not extract valid JSON from response',
                'error_type': 'json_decode_error',
                'raw_response': raw_response,
                'partial_data': partial_data
            }
        except Exception as e:
            logger.exception(f"Unexpected error in style analysis post-processing: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Response length: {len(raw_response) if raw_response else 0}")
            logger.error(f"Validated params: {validated_params}")
            
            return {
                'success': False,
                'error': f'Processing error: {str(e)}',
                'error_type': type(e).__name__,
                'raw_response': raw_response[:500] if raw_response else None
            }