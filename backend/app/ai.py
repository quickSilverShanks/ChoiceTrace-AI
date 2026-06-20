import os
import json
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger("app.ai")

# Configure Google GenAI SDK if API key is provided
api_key_configured = False
if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        api_key_configured = True
        logger.info("Gemini API successfully configured.")
    except Exception as e:
        logger.error(f"Error configuring Gemini API: {str(e)}")

# Persona details for prompts and mock engine
PERSONA_PROFILES = {
    "student": {
        "description": "A budget-conscious student who wants easy, cost-effective green choices. Focuses on walking, public transit, low-cost plant-based meals, and laptop energy saving.",
        "weekly_budget_focus": "Low-cost/saving money",
        "primary_transport": "Walking, cycling, metro"
    },
    "professional": {
        "description": "A busy working professional seeking convenience and smart productivity. Focuses on ride-sharing, smart thermostat adjustment, meal prepping, and choosing energy-star devices.",
        "weekly_budget_focus": "Time-saving & premium smart adjustments",
        "primary_transport": "Car, ride-share, train"
    },
    "commuter": {
        "description": "An urban commuter who spends significant time traveling. Focuses heavily on public transit vs car comparisons, multi-modal routes, and e-bikes.",
        "weekly_budget_focus": "Efficiency & travel times",
        "primary_transport": "Metro, bus, bike-sharing, electric scooter"
    },
    "family": {
        "description": "A family of four focused on household habits, bulk grocery shopping, energy efficiency for appliances, and teaching sustainable habits to kids.",
        "weekly_budget_focus": "Household utility savings & bulk choices",
        "primary_transport": "Family SUV, carpooling, school bus"
    },
    "enthusiast": {
        "description": "A dedicated sustainability enthusiast looking for advanced carbon-reduction techniques like home composting, smart micro-grids, eco-conscious investing, and plastic-free shopping.",
        "weekly_budget_focus": "Maximum carbon reduction",
        "primary_transport": "EV, cycling, walking"
    }
}

# Mock database of recommendations for fallback engine
MOCK_RECOMMENDATIONS = {
    "commute": [
        {
            "title": "Daily Office Commute",
            "original_action": "Drive alone in gasoline car",
            "original_carbon": 4.6,
            "recommended_alternative": "Take the metro and walk 10 minutes",
            "alternative_carbon": 0.5,
            "carbon_saved": 4.1,
            "cost_saved": 5.50,
            "difficulty": "Easy",
            "confidence_score": 0.95,
            "reasoning": "Taking the metro cuts 89% of emissions and eliminates parking stress. Walking 10 mins covers 1,000 steps of your daily target."
        },
        {
            "title": "Short Errand (3 km)",
            "original_action": "Drive car to local shop",
            "original_carbon": 1.2,
            "recommended_alternative": "Ride a bike or walk",
            "alternative_carbon": 0.0,
            "carbon_saved": 1.2,
            "cost_saved": 1.50,
            "difficulty": "Easy",
            "confidence_score": 0.98,
            "reasoning": "Short car trips emit disproportionately more due to cold engines. Cycling is free, fast, and healthy."
        }
    ],
    "food": [
        {
            "title": "Lunch order",
            "original_action": "Beef burger with fries",
            "original_carbon": 3.2,
            "recommended_alternative": "Plant-based burger or Falafel wrap",
            "alternative_carbon": 0.6,
            "carbon_saved": 2.6,
            "cost_saved": 1.00,
            "difficulty": "Easy",
            "confidence_score": 0.92,
            "reasoning": "Beef has a massive carbon footprint due to land-use change and enteric fermentation. Plant proteins use 90% less land and water."
        },
        {
            "title": "Dinner ingredient shopping",
            "original_action": "Imported out-of-season berries & beef steak",
            "original_carbon": 8.5,
            "recommended_alternative": "Local seasonal ingredients & grilled chicken/tofu",
            "alternative_carbon": 1.5,
            "carbon_saved": 7.0,
            "cost_saved": 6.50,
            "difficulty": "Medium",
            "confidence_score": 0.88,
            "reasoning": "Imported food relies on air-freight which carries 50x the emissions of rail or sea. Cooking local produce is cheaper and fresher."
        }
    ],
    "grocery": [
        {
            "title": "Weekly Groceries",
            "original_action": "Packaged plastic wrapped produce and snacks",
            "original_carbon": 2.8,
            "recommended_alternative": "Zero-waste shop, bulk bin beans, and reusable bags",
            "alternative_carbon": 0.8,
            "carbon_saved": 2.0,
            "cost_saved": 2.50,
            "difficulty": "Medium",
            "confidence_score": 0.85,
            "reasoning": "Single-use plastics contribute heavily to chemical emissions. Buying bulk saves package costs."
        }
    ],
    "shopping": [
        {
            "title": "Purchase Laptop",
            "original_action": "Brand new high-end laptop",
            "original_carbon": 320.0,
            "recommended_alternative": "Certified refurbished laptop (Grade A)",
            "alternative_carbon": 60.0,
            "carbon_saved": 260.0,
            "cost_saved": 250.00,
            "difficulty": "Easy",
            "confidence_score": 0.90,
            "reasoning": "80% of a laptop's lifetime footprint happens during manufacturing. Buying refurbished extends the device lifecycle."
        }
    ],
    "energy": [
        {
            "title": "Home cooling/heating",
            "original_action": "Running AC at 21°C (70°F) all evening",
            "original_carbon": 2.2,
            "recommended_alternative": "Set AC to 24°C (75°F) and use a ceiling fan",
            "alternative_carbon": 1.4,
            "carbon_saved": 0.8,
            "cost_saved": 1.20,
            "difficulty": "Easy",
            "confidence_score": 0.95,
            "reasoning": "Each degree higher on the AC saves about 6% on cooling electricity. Fans make it feel 2 degrees cooler by circulating air."
        }
    ],
    "travel": [
        {
            "title": "Weekend getaway (300 km)",
            "original_action": "Short flight to regional city",
            "original_carbon": 85.0,
            "recommended_alternative": "High-speed electric train",
            "alternative_carbon": 9.0,
            "carbon_saved": 76.0,
            "cost_saved": 40.00,
            "difficulty": "Medium",
            "confidence_score": 0.94,
            "reasoning": "A regional flight has massive take-off emissions. Train travel emits 90% less per passenger-kilometer and lets you work."
        }
    ]
}

def get_activity_recommendation(activity_type: str, current_choice: str, details_text: Optional[str] = None, persona: str = "professional") -> Dict[str, Any]:
    """
    Generates a structured recommendation comparing current_choice to a lower carbon alternative.
    """
    activity_type = activity_type.lower()
    
    # Try Gemini if configured
    if api_key_configured:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            You are CarbonNudge AI, a proactive sustainability coach.
            Generate a low-carbon alternative for a user with the persona '{persona}' ({PERSONA_PROFILES.get(persona, {}).get('description', '')}).
            
            Activity Type: {activity_type}
            User's Current Plan/Choice: {current_choice}
            Additional Details: {details_text or 'None'}
            
            Provide the response in raw JSON format (no backticks, no markdown) containing the following fields:
            - "title": A short name for the activity
            - "original_action": Clear description of current choice
            - "original_carbon": Estimated CO2 impact of original choice in kg (use realistic scientific values)
            - "recommended_alternative": Specific actionable lower-carbon alternative suitable for a {persona}
            - "alternative_carbon": Estimated CO2 impact of alternative in kg
            - "carbon_saved": Original minus alternative carbon in kg
            - "cost_saved": Estimated cost savings in USD (e.g. gas, electricity, shopping price differences)
            - "difficulty": "Easy", "Medium", or "Hard"
            - "confidence_score": Float between 0.8 and 0.99
            - "reasoning": A friendly, encouraging 2-sentence explanation of why the alternative is better and how it fits their persona.
            """
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
            return data
        except Exception as e:
            logger.error(f"Gemini error in get_activity_recommendation: {str(e)}. Falling back to mock engine.")

    # Fallback Mock Engine
    # Get matches from template
    templates = MOCK_RECOMMENDATIONS.get(activity_type, MOCK_RECOMMENDATIONS["food"])
    # Pick a baseline template
    base = dict(templates[0])
    
    # Customize template based on details or current choice
    if current_choice:
        base["original_action"] = current_choice
        
    # Scale or adjust values based on persona
    if persona == "student":
        # Make cost savings feel high, adjust difficulty
        base["cost_saved"] = round(base["cost_saved"] * 1.2, 2)
        base["reasoning"] += " This option is extremely budget-friendly for students."
    elif persona == "family":
        # Scale emissions and savings by family size (e.g., multiplier of 3x)
        base["original_carbon"] = round(base["original_carbon"] * 3.0, 1)
        base["alternative_carbon"] = round(base["alternative_carbon"] * 3.0, 1)
        base["carbon_saved"] = round(base["original_carbon"] - base["alternative_carbon"], 1)
        base["cost_saved"] = round(base["cost_saved"] * 2.8, 2)
        base["reasoning"] = base["reasoning"].replace("your", "your family's").replace("You", "Your family")
    
    return base

def get_coach_response(user_message: str, chat_history: List[Dict[str, str]], persona: str = "professional") -> Dict[str, Any]:
    """
    Generates a conversational reply from the AI Sustainability Coach.
    Returns: Dict containing reply, estimated_carbon_impact, reasoning, alternatives, potential_savings.
    """
    user_msg_lower = user_message.lower()
    
    # Try Gemini if configured
    if api_key_configured:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            history_prompt = ""
            for h in chat_history[-6:]:
                role = "User" if h["role"] == "user" else "Coach"
                history_prompt += f"{role}: {h['content']}\n"
                
            prompt = f"""
            You are CarbonNudge AI, a friendly, encouraging personal sustainability coach (like a combination of Duolingo, Fitbit, and ChatGPT for carbon reduction).
            The user is a '{persona}' ({PERSONA_PROFILES.get(persona, {}).get('description', '')}).
            
            Chat History:
            {history_prompt}
            
            Current User Message: "{user_message}"
            
            Deliver a direct, encouraging response. Do not use guilt.
            Provide the response in raw JSON format (no markdown, no code block wrappers) containing the following keys:
            - "reply": Conversational response answering the user directly (max 3 sentences).
            - "estimated_carbon_impact": A short statement quantifying carbon impact of their action (e.g. "2.4 kg CO2 per drive").
            - "reasoning": Scientific explanation behind this impact (1 sentence).
            - "alternatives": A list of 2 better alternatives.
            - "potential_savings": Estimate of monthly or yearly savings if they switch (e.g. "Save ~45 kg CO2 monthly by switching").
            """
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text.strip())
        except Exception as e:
            logger.error(f"Gemini error in get_coach_response: {str(e)}. Falling back to mock coach.")

    # Fallback Mock Coach
    reply = "That's a great question! "
    impact = "Varies based on specifics"
    reason = "Every daily habit has an embedded carbon emission from combustion or manufacturing."
    alts = ["Choose a shared transportation alternative", "Select seasonal or organic ingredients"]
    savings = "Approximately 1.5 kg CO2 saved per switch"
    
    if "drive" in user_msg_lower or "car" in user_msg_lower or "transport" in user_msg_lower:
        reply += "Opting out of solo driving is the single biggest day-to-day adjustment you can make. Public transit, cycling, or walking significantly decreases fossil fuel reliance."
        impact = "Solo driving: ~250g CO2 per km"
        reason = "Gasoline engines release carbon dioxide directly through combustion, whereas electric transit shares overhead emissions among hundreds of passengers."
        alts = ["Use the Metro / Bus system", "Cycle or Walk for trips under 3km"]
        savings = "Save ~80 kg CO2 monthly if you replace 5 short trips per week"
        
    elif "burger" in user_msg_lower or "lunch" in user_msg_lower or "food" in user_msg_lower or "meat" in user_msg_lower:
        reply += "Food emissions are heavily driven by livestock production. Choosing a plant-based alternative is highly effective and often delicious!"
        impact = "Beef Burger: ~3.2 kg CO2 | Veggie Burger: ~0.6 kg CO2"
        reason = "Cattle farming requires extensive land clearing, generates methane, and requires energy-intensive feed crops compared to plant harvesting."
        alts = ["Falafel or Bean Veggie Burger", "Local organic vegetable soup"]
        savings = "Save ~10.4 kg CO2 monthly by replacing beef once a week"
        
    elif "shopping" in user_msg_lower or "product" in user_msg_lower or "buy" in user_msg_lower:
        reply += "Buying refurbished products rather than new ones keeps items out of landfills and avoids supply chain manufacturing emissions."
        impact = "New Electronic Device: ~150kg to 350kg CO2"
        reason = "Extracting rare earth minerals and operating high-temperature semiconductor fabs accounts for 80%+ of device emissions."
        alts = ["Purchase a Certified Refurbished model", "Rent or share items used infrequently"]
        savings = "Save 200+ kg CO2 per electronics purchase"
        
    else:
        reply += f"Making small adjustments as a {persona} fits perfectly in your routine. Start with easy wins like turning off idle devices and choosing local products!"
        
    return {
        "reply": reply,
        "estimated_carbon_impact": impact,
        "reasoning": reason,
        "alternatives": alts,
        "potential_savings": savings
    }

def get_habit_insights(activities: List[Dict[str, Any]], persona: str = "professional") -> List[str]:
    """
    Analyzes historical activities list to generate personalized insights.
    """
    if api_key_configured:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            activities_json = json.dumps(activities[-10:])
            prompt = f"""
            You are CarbonNudge AI. Analyze this user's recent activities and generate 3 bullet points of insights.
            User Persona: {persona}
            Recent logs: {activities_json}
            
            Return a raw JSON list of strings, for example:
            [
              "You drive short distances 4 times per week. Replacing half of those trips with walking could save approximately 15 kg CO2 monthly.",
              "Ordering beef burger accounts for 40% of your food footprint. Swapping it for chicken or plant-based options saves X kg CO2.",
              "Great job completing challenges! Your daily AC adjustments are saving 5 kg CO2 weekly."
            ]
            """
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text.strip())
        except Exception as e:
            logger.error(f"Gemini error in get_habit_insights: {str(e)}. Using fallback insights.")

    # Fallback Mock Insights
    insights = [
        "You drive short distances 4 times per week. Replacing half of those trips with walking or cycling could save approximately 18.2 kg CO2 monthly.",
        "Food choices currently represent your highest daily emission peaks. Swapping beef meals for plant-based alternatives twice weekly will reduce diet emissions by 35%.",
        "Streak active! Your consistency in checking home electronics before leaving has prevented approximately 4.8 kg CO2 this week."
    ]
    
    if persona == "student":
        insights[0] = "Short commuting trips represent a major savings opportunity. Swapping ride-shares with student metro pass trips saves you $40 and 22 kg CO2 monthly."
    elif persona == "family":
        insights[0] = "Your household commute is high. Organizing carpools for school runs could save your family 65 kg CO2 and $80 in fuel monthly."
        insights[1] = "Heating/cooling represents 45% of your utility carbon. Increasing AC temperature by 1°C on summer days will save $15 and 28 kg CO2 monthly."
        
    return insights
