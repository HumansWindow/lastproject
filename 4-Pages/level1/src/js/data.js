const humanTraitsData = {
    name: "Traits",
    children: [
        {
            name: "Human Traits",
            children: [
                {
                    name: "Positive Traits (37%)",
                    children: [
                        {
                            name: "Interpersonal",
                            children: [
                                { name: "Accessible", value: 1 },
                                { name: "Amiable", value: 1 },
                                { name: "Compassionate", value: 1 },
                                { name: "Friendly", value: 1 },
                                { name: "Generous", value: 1 },
                                { name: "Gentle", value: 1 },
                                { name: "Gracious", value: 1 },
                                { name: "Helpful", value: 1 },
                                { name: "Kind", value: 1 },
                                { name: "Loyal", value: 1 },
                                { name: "Modest", value: 1 },
                                { name: "Patient", value: 1 },
                                { name: "Polite", value: 1 },
                                { name: "Respectful", value: 1 },
                                { name: "Sociable", value: 1 },
                                { name: "Sympathetic", value: 1 },
                                { name: "Tolerant", value: 1 },
                                { name: "Trustworthy_Interpersonal", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Understanding", value: 1 },
                                { name: "Warm", value: 1 },
                                { name: "Well-mannered", value: 1 },
                                { name: "Youthful", value: 1 }
                            ]
                        },
                        {
                            name: "Achievement",
                            children: [
                                { name: "Active", value: 1 },
                                { name: "Adventurous", value: 1 },
                                { name: "Ambitious", value: 1 },
                                { name: "Capable", value: 1 },
                                { name: "Confident", value: 1 },
                                { name: "Courageous", value: 1 },
                                { name: "Diligent", value: 1 },
                                { name: "Efficient", value: 1 },
                                { name: "Energetic", value: 1 },
                                { name: "Enthusiastic", value: 1 },
                                { name: "Focused", value: 1 },
                                { name: "Hardworking", value: 1 },
                                { name: "Independent", value: 1 },
                                { name: "Innovative", value: 1 },
                                { name: "Motivated", value: 1 },
                                { name: "Organized", value: 1 },
                                { name: "Persistent", value: 1 },
                                { name: "Proactive", value: 1 },
                                { name: "Resourceful", value: 1 },
                                { name: "Responsible", value: 1 },
                                { name: "Self-reliant", value: 1 },
                                { name: "Self-sufficient", value: 1 },
                                { name: "Strong-willed", value: 1 },
                                { name: "Tenacious", value: 1 },
                                { name: "Versatile", value: 1 }
                            ]
                        },
                        {
                            name: "Character",
                            children: [
                                { name: "Honest", value: 1 },
                                { name: "Honorable", value: 1 },
                                { name: "Principled", value: 1 },
                                { name: "Reliable", value: 1 },
                                { name: "Sincere", value: 1 },
                                { name: "Trustworthy_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Upright", value: 1 },
                                { name: "Virtuous", value: 1 }
                            ]
                        },
                        {
                            name: "Intelligence",
                            children: [
                                { name: "Analytical", value: 1 },
                                { name: "Creative", value: 1 },
                                { name: "Logical", value: 1 },
                                { name: "Perceptive", value: 1 },
                                { name: "Quick-witted", value: 1 },
                                { name: "Rational", value: 1 },
                                { name: "Resourceful_Intelligence", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Sharp", value: 1 }
                            ]
                        }
                    ]
                },
                {
                    name: "Neutral Traits (18%)",
                    children: [
                        {
                            name: "Temperament",
                            children: [
                                { name: "Casual", value: 1 },
                                { name: "Reserved_Neutral", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Calm_Neutral", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Cool_Neutral", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Detached", value: 1 },
                                { name: "Easygoing", value: 1 },
                                { name: "Even-tempered", value: 1 },
                                { name: "Laid-back", value: 1 },
                                { name: "Mellow", value: 1 },
                                { name: "Nonchalant", value: 1 },
                                { name: "Relaxed", value: 1 },
                                { name: "Serene_Neutral", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Stable_Neutral", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Stoic_Neutral", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Tranquil", value: 1 }
                            ]
                        },
                        {
                            name: "Behavioral",
                            children: [
                                { name: "Formal", value: 1 },
                                { name: "Quiet", value: 1 },
                                { name: "Cautious", value: 1 },
                                { name: "Conservative", value: 1 },
                                { name: "Conventional", value: 1 },
                                { name: "Disciplined", value: 1 },
                                { name: "Discreet", value: 1 },
                                { name: "Methodical", value: 1 },
                                { name: "Moderate", value: 1 },
                                { name: "Orderly", value: 1 },
                                { name: "Practical", value: 1 },
                                { name: "Reserved_Behavioral", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Restrained", value: 1 },
                                { name: "Serious_Behavioral", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Solemn", value: 1 },
                                { name: "Steady", value: 1 },
                                { name: "Systematic", value: 1 },
                                { name: "Thorough", value: 1 },
                                { name: "Tidy", value: 1 }
                            ]
                        },
                        {
                            name: "Disposition",
                            children: [
                                { name: "Disposition_Serious", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Disposition_Stoic", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Disposition_Calm", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Disposition_Cool", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Disposition_Detached", value: 1 },
                                { name: "Disposition_Easygoing", value: 1 },
                                { name: "Disposition_Even-tempered", value: 1 },
                                { name: "Disposition_Laid-back", value: 1 },
                                { name: "Disposition_Mellow", value: 1 },
                                { name: "Disposition_Nonchalant", value: 1 },
                                { name: "Disposition_Relaxed", value: 1 },
                                { name: "Disposition_Serene", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Disposition_Stable", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Disposition_Tranquil", value: 1 }
                            ]
                        }
                    ]
                },
                {
                    name: "Negative Traits (46%)",
                    children: [
                        {
                            name: "Interpersonal Flaws",
                            children: [
                                { name: "Arrogant", value: 1 },
                                { name: "Hostile", value: 1 },
                                { name: "Abrasive", value: 1 },
                                { name: "Aloof", value: 1 },
                                { name: "Argumentative", value: 1 },
                                { name: "Callous", value: 1 },
                                { name: "Conceited", value: 1 },
                                { name: "Critical", value: 1 },
                                { name: "Cynical", value: 1 },
                                { name: "Deceitful", value: 1 },
                                { name: "Disloyal", value: 1 },
                                { name: "Dishonest_Interpersonal", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Disrespectful", value: 1 },
                                { name: "Egotistical", value: 1 },
                                { name: "Envious", value: 1 },
                                { name: "Greedy", value: 1 },
                                { name: "Hateful", value: 1 },
                                { name: "Hypocritical_Interpersonal", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Insensitive", value: 1 },
                                { name: "Intolerant", value: 1 },
                                { name: "Jealous", value: 1 },
                                { name: "Manipulative", value: 1 },
                                { name: "Narcissistic", value: 1 },
                                { name: "Pessimistic", value: 1 },
                                { name: "Prejudiced", value: 1 },
                                { name: "Rude", value: 1 },
                                { name: "Selfish", value: 1 },
                                { name: "Spiteful", value: 1 },
                                { name: "Suspicious", value: 1 },
                                { name: "Unforgiving", value: 1 },
                                { name: "Unreliable", value: 1 },
                                { name: "Vindictive", value: 1 }
                            ]
                        },
                        {
                            name: "Behavioral Issues",
                            children: [
                                { name: "Careless", value: 1 },
                                { name: "Impulsive", value: 1 },
                                { name: "Aggressive", value: 1 },
                                { name: "Apathetic", value: 1 },
                                { name: "Clumsy", value: 1 },
                                { name: "Compulsive", value: 1 },
                                { name: "Disorganized", value: 1 },
                                { name: "Erratic", value: 1 },
                                { name: "Foolish", value: 1 },
                                { name: "Forgetful", value: 1 },
                                { name: "Inconsistent", value: 1 },
                                { name: "Indecisive", value: 1 },
                                { name: "Indifferent", value: 1 },
                                { name: "Inflexible", value: 1 },
                                { name: "Irresponsible", value: 1 },
                                { name: "Lazy", value: 1 },
                                { name: "Negligent", value: 1 },
                                { name: "Obsessive", value: 1 },
                                { name: "Reckless", value: 1 },
                                { name: "Sloppy", value: 1 },
                                { name: "Unfocused", value: 1 },
                                { name: "Unmotivated", value: 1 },
                                { name: "Unpredictable", value: 1 },
                                { name: "Unstable", value: 1 }
                            ]
                        },
                        {
                            name: "Character Flaws",
                            children: [
                                { name: "Dishonest_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Unreliable_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Amoral", value: 1 },
                                { name: "Corrupt", value: 1 },
                                { name: "Cowardly", value: 1 },
                                { name: "Cruel", value: 1 },
                                { name: "Deceitful_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Disloyal_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Greedy_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Hypocritical_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Immoral", value: 1 },
                                { name: "Inconsiderate", value: 1 },
                                { name: "Insensitive_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Intolerant_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Irresponsible_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Jealous_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Manipulative_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Narcissistic_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Pessimistic_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Prejudiced_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Rude_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Selfish_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Spiteful_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Suspicious_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Unforgiving_Character", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Vindictive_Character", value: 1 } // Renamed to ensure uniqueness
                            ]
                        },
                        {
                            name: "Emotional Issues",
                            children: [
                                { name: "Anxious", value: 1 },
                                { name: "Moody", value: 1 },
                                { name: "Angry", value: 1 },
                                { name: "Depressed", value: 1 },
                                { name: "Fearful", value: 1 },
                                { name: "Gloomy", value: 1 },
                                { name: "Insecure", value: 1 },
                                { name: "Irritable", value: 1 },
                                { name: "Jealous_Emotional", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Lonely", value: 1 },
                                { name: "Melancholic", value: 1 },
                                { name: "Nervous", value: 1 },
                                { name: "Paranoid", value: 1 },
                                { name: "Pessimistic_Emotional", value: 1 }, // Renamed to ensure uniqueness
                                { name: "Sad", value: 1 },
                                { name: "Stressed", value: 1 },
                                { name: "Unhappy", value: 1 },
                                { name: "Worried", value: 1 }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: "Planetary Traits",
            children: [
                {
                    name: "Positive Traits",
                    children: [
                        { name: "Habitable", value: 1 },
                        { name: "Fertile", value: 1 },
                        { name: "Vibrant", value: 1 },
                        { name: "Stable_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Resourceful_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Lush", value: 1 },
                        { name: "Diverse", value: 1 },
                        { name: "Energetic_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Majestic", value: 1 },
                        { name: "Radiant", value: 1 },
                        { name: "Protective", value: 1 },
                        { name: "Harmonious", value: 1 },
                        { name: "Balanced", value: 1 },
                        { name: "Resilient_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Regenerative", value: 1 },
                        { name: "Guiding", value: 1 },
                        { name: "Prosperous", value: 1 },
                        { name: "Generous_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Nurturing", value: 1 },
                        { name: "Inspirational", value: 1 },
                        { name: "Powerful", value: 1 }
                    ]
                },
                {
                    name: "Neutral Traits",
                    children: [
                        { name: "Arid", value: 1 },
                        { name: "Cold", value: 1 },
                        { name: "Isolated_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Expansive", value: 1 },
                        { name: "Ancient", value: 1 },
                        { name: "Mysterious", value: 1 },
                        { name: "Rugged", value: 1 },
                        { name: "Quiet_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Remote", value: 1 },
                        { name: "Passive", value: 1 },
                        { name: "Observant", value: 1 },
                        { name: "Unchanging", value: 1 },
                        { name: "Enigmatic", value: 1 },
                        { name: "Reserved_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Independent", value: 1 }
                    ]
                },
                {
                    name: "Negative Traits",
                    children: [
                        { name: "Barren", value: 1 },
                        { name: "Hostile_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Chaotic", value: 1 },
                        { name: "Desolate", value: 1 },
                        { name: "Overheated", value: 1 },
                        { name: "Toxic", value: 1 },
                        { name: "Unstable_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Volcanic", value: 1 },
                        { name: "Distant", value: 1 },
                        { name: "Inhospitable", value: 1 },
                        { name: "Isolated_Negative", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Oppressive", value: 1 },
                        { name: "Neglectful", value: 1 },
                        { name: "Destructive", value: 1 },
                        { name: "Unforgiving_Planetary", value: 1 }, // Renamed to ensure uniqueness
                        { name: "Tyrannical", value: 1 }
                    ]
                }
            ]
        },
        {
            name: "Animal Traits",
            children: [
                {
                    name: "Positive Traits",
                    children: [
                        {
                            name: "Interpersonal",
                            children: [
                                { name: "Loyal", value: 1 },
                                { name: "Friendly", value: 1 },
                                { name: "Gentle", value: 1 },
                                { name: "Protective", value: 1 },
                                { name: "Compassionate", value: 1 },
                                { name: "Playful", value: 1 },
                                { name: "Affectionate", value: 1 },
                                { name: "Trusting", value: 1 }
                            ]
                        },
                        {
                            name: "Physical",
                            children: [
                                { name: "Agile", value: 1 },
                                { name: "Athletic", value: 1 },
                                { name: "Energetic", value: 1 },
                                { name: "Strong", value: 1 },
                                { name: "Hardy", value: 1 },
                                { name: "Graceful", value: 1 }
                            ]
                        },
                        {
                            name: "Intellectual",
                            children: [
                                { name: "Intelligent", value: 1 },
                                { name: "Observant", value: 1 },
                                { name: "Clever", value: 1 },
                                { name: "Resourceful", value: 1 }
                                // Removed duplicate "Curious" as it appears in Neutral Traits
                            ]
                        },
                        {
                            name: "Leadership",
                            children: [
                                { name: "Courageous", value: 1 },
                                { name: "Confident", value: 1 },
                                { name: "Leaderly", value: 1 },
                                { name: "Watchful", value: 1 }
                            ]
                        },
                        {
                            name: "Aesthetic",
                            children: [
                                { name: "Vibrant", value: 1 },
                                { name: "Adaptable", value: 1 },
                                { name: "Elegant", value: 1 }
                            ]
                        }
                    ]
                },
                {
                    name: "Neutral Traits",
                    children: [
                        {
                            name: "Social",
                            children: [
                                { name: "Solitary", value: 1 },
                                { name: "Territorial", value: 1 },
                                { name: "Independent", value: 1 },
                                { name: "Quiet", value: 1 },
                                { name: "Outspoken", value: 1 }
                            ]
                        },
                        {
                            name: "Behavioral",
                            children: [
                                { name: "Ambitious", value: 1 },
                                { name: "Determined", value: 1 },
                                { name: "Experimental", value: 1 },
                                { name: "Frugal", value: 1 }
                            ]
                        },
                        {
                            name: "Physical",
                            children: [
                                { name: "Sleek", value: 1 },
                                { name: "Rough", value: 1 },
                                { name: "Balanced", value: 1 }
                            ]
                        },
                        {
                            name: "Other",
                            children: [
                                { name: "Curious", value: 1 },
                                { name: "Whimsical", value: 1 }
                                // Removed duplicate "Playful" as it appears in Positive Traits
                            ]
                        }
                    ]
                },
                {
                    name: "Negative Traits",
                    children: [
                        {
                            name: "Social and Behavioral",
                            children: [
                                { name: "Aggressive", value: 1 },
                                { name: "Aloof", value: 1 },
                                { name: "Stubborn", value: 1 },
                                { name: "Selfish", value: 1 },
                                { name: "Competitive", value: 1 },
                                { name: "Jealous", value: 1 }
                            ]
                        },
                        {
                            name: "Physical",
                            children: [
                                { name: "Clumsy", value: 1 },
                                { name: "Slow", value: 1 },
                                { name: "Weak", value: 1 }
                            ]
                        },
                        {
                            name: "Emotional",
                            children: [
                                { name: "Fearful", value: 1 },
                                { name: "Anxious", value: 1 },
                                { name: "Irritable", value: 1 },
                                { name: "Moody", value: 1 }
                            ]
                        },
                        {
                            name: "Other",
                            children: [
                                { name: "Greedy", value: 1 },
                                { name: "Lazy", value: 1 },
                                { name: "Destructive", value: 1 },
                                { name: "Vicious", value: 1 }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: "Plant Traits",
            children: [
                {
                    name: "Positive Traits",
                    children: [
                        {
                            name: "Physical",
                            children: [
                                { name: "Lush", value: 1 },
                                { name: "Vibrant", value: 1 },
                                { name: "Hardy", value: 1 },
                                { name: "Resilient", value: 1 },
                                { name: "Thriving", value: 1 },
                                { name: "Evergreen", value: 1 },
                                { name: "Flourishing", value: 1 },
                                { name: "Aromatic", value: 1 },
                                { name: "Blooming", value: 1 },
                                { name: "Colorful", value: 1 },
                                { name: "Fertile", value: 1 },
                                { name: "Leafy", value: 1 },
                                { name: "Fruitful", value: 1 }
                            ]
                        },
                        {
                            name: "Symbolic",
                            children: [
                                { name: "Nurturing", value: 1 },
                                { name: "Healing", value: 1 },
                                { name: "Generous", value: 1 },
                                { name: "Adaptive", value: 1 },
                                { name: "Protective", value: 1 },
                                { name: "Inspiring", value: 1 },
                                { name: "Regenerative", value: 1 },
                                { name: "Grounding", value: 1 }
                            ]
                        },
                        {
                            name: "Functional",
                            children: [
                                { name: "Medicinal", value: 1 },
                                { name: "Sustainable", value: 1 },
                                { name: "Purifying", value: 1 },
                                { name: "Nourishing", value: 1 },
                                { name: "Stabilizing", value: 1 },
                                { name: "Versatile", value: 1 }
                            ]
                        }
                    ]
                },
                {
                    name: "Neutral Traits",
                    children: [
                        {
                            name: "Physical",
                            children: [
                                { name: "Deciduous", value: 1 },
                                { name: "Seasonal", value: 1 },
                                { name: "Dormant", value: 1 },
                                { name: "Slow-growing", value: 1 },
                                { name: "Climbing", value: 1 },
                                { name: "Shrubby", value: 1 },
                                { name: "Spreading", value: 1 },
                                { name: "Adaptable", value: 1 }
                            ]
                        },
                        {
                            name: "Symbolic",
                            children: [
                                { name: "Wild", value: 1 },
                                { name: "Neutral", value: 1 },
                                { name: "Passive", value: 1 },
                                { name: "Quiet", value: 1 }
                            ]
                        },
                        {
                            name: "Functional",
                            children: [
                                { name: "Practical", value: 1 },
                                { name: "Localized", value: 1 },
                                { name: "Common", value: 1 },
                                { name: "Utilitarian", value: 1 }
                            ]
                        }
                    ]
                },
                {
                    name: "Negative Traits",
                    children: [
                        {
                            name: "Physical",
                            children: [
                                { name: "Withered", value: 1 },
                                { name: "Parasitic", value: 1 },
                                { name: "Thorny", value: 1 },
                                { name: "Brittle", value: 1 },
                                { name: "Overgrown", value: 1 },
                                { name: "Diseased", value: 1 },
                                { name: "Infested", value: 1 },
                                { name: "Poisonous", value: 1 },
                                { name: "Fragile", value: 1 },
                                { name: "Wilting", value: 1 }
                            ]
                        },
                        {
                            name: "Symbolic",
                            children: [
                                { name: "Hostile", value: 1 },
                                { name: "Draining", value: 1 },
                                { name: "Invading", value: 1 },
                                { name: "Oppressive", value: 1 },
                                { name: "Neglectful", value: 1 }
                            ]
                        },
                        {
                            name: "Functional",
                            children: [
                                { name: "Choking", value: 1 },
                                { name: "Unsustainable", value: 1 },
                                { name: "Suffocating", value: 1 },
                                { name: "Resource-draining", value: 1 }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: "God Traits",
            children: [
                {
                    name: "Divine Attributes",
                    children: [
                        {
                            name: "Mercy and Compassion",
                            children: [
                                { name: "The Most Compassionate", value: 1 },
                                { name: "The Most Merciful", value: 1 },
                                { name: "The Most Kind", value: 1 },
                                { name: "The Most Loving", value: 1 },
                                { name: "The Constant Forgiver", value: 1 },
                                { name: "The Great Forgiver", value: 1 },
                                { name: "The Most Appreciative", value: 1 },
                                { name: "The Ever-Accepter of Repentance", value: 1 },
                                { name: "The Pardoner", value: 1 }
                            ]
                        },
                        {
                            name: "Power and Authority",
                            children: [
                                { name: "The King", value: 1 },
                                { name: "The Almighty", value: 1 },
                                { name: "The Supreme", value: 1 },
                                { name: "The All-Strong", value: 1 },
                                { name: "The Omnipotent", value: 1 },
                                { name: "The Sole Authority", value: 1 },
                                { name: "Master of the Kingdom", value: 1 },
                                { name: "The Creator of All Power", value: 1 }
                            ]
                        },
                        {
                            name: "Creation and Sustenance",
                            children: [
                                { name: "The Creator", value: 1 },
                                { name: "The Evolver", value: 1 },
                                { name: "The Fashioner", value: 1 },
                                { name: "The Incomparable Originator", value: 1 },
                                { name: "The Provider", value: 1 },
                                { name: "The Sustainer", value: 1 },
                                { name: "The Preserver", value: 1 },
                                { name: "The Giver of Life", value: 1 }
                            ]
                        },
                        {
                            name: "Knowledge and Wisdom",
                            children: [
                                { name: "The All-Knowing", value: 1 },
                                { name: "The All-Seeing", value: 1 },
                                { name: "The All-Hearing", value: 1 },
                                { name: "The All-Aware", value: 1 },
                                { name: "The All-Wise", value: 1 },
                                { name: "The Guide", value: 1 },
                                { name: "The Guide, Infallible Teacher", value: 1 }
                            ]
                        },
                        {
                            name: "Justice and Truth",
                            children: [
                                { name: "The Impartial Judge", value: 1 },
                                { name: "The Utterly Just", value: 1 },
                                { name: "The Just One", value: 1 },
                                { name: "The Absolute Truth", value: 1 },
                                { name: "The Avenger", value: 1 },
                                { name: "The Reckoner", value: 1 }
                            ]
                        },
                        {
                            name: "Transcendence",
                            children: [
                                { name: "The Most High", value: 1 },
                                { name: "The Most Great", value: 1 },
                                { name: "The Magnificent", value: 1 },
                                { name: "The Majestic", value: 1 },
                                { name: "The Glorious", value: 1 },
                                { name: "The Self Exalted", value: 1 },
                                { name: "Possessor of Glory and Honour", value: 1 }
                            ]
                        },
                        {
                            name: "Uniqueness",
                            children: [
                                { name: "The Only One", value: 1 },
                                { name: "The Sole One", value: 1 },
                                { name: "The Self-Sufficient", value: 1 },
                                { name: "The First", value: 1 },
                                { name: "The Last", value: 1 },
                                { name: "The Manifest", value: 1 },
                                { name: "The Hidden One", value: 1 }
                            ]
                        },
                        {
                            name: "Divine Actions",
                            children: [
                                { name: "The All-Opening", value: 1 },
                                { name: "The Extender", value: 1 },
                                { name: "The Reducer", value: 1 },
                                { name: "The Exalter", value: 1 },
                                { name: "The Expediter", value: 1 },
                                { name: "The Delayer", value: 1 },
                                { name: "The Resurrector", value: 1 },
                                { name: "The Creator of Death", value: 1 }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

// Make sure humanTraitsData is available globally
if (typeof window !== 'undefined') {
    window.humanTraitsData = humanTraitsData;
}
