#!/bin/bash

echo "======================================"
echo "🔍 ANALYZING ID FIELD CONSISTENCY"
echo "======================================"

# Set the project root directory
PROJECT_ROOT="/home/alivegod/Desktop/LastProject"
cd "$PROJECT_ROOT" || exit 1

# Define color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create temporary files
ENTITIES_FILE=$(mktemp)
SERVICES_FILE=$(mktemp)
CONTROLLERS_FILE=$(mktemp)
DTOS_FILE=$(mktemp)

# Clean up temp files on exit
trap 'rm -f "$ENTITIES_FILE" "$SERVICES_FILE" "$CONTROLLERS_FILE" "$DTOS_FILE"' EXIT

# Find and analyze entity ID patterns
echo -e "\n${BLUE}Analyzing Entity ID Patterns...${NC}"
grep -r --include="*.entity.ts" "@PrimaryGeneratedColumn\|@Column.*id\|@Column.*Id\|id: \|userId: " ./backend/src/ > "$ENTITIES_FILE"

TOTAL_ENTITIES=$(grep -r --include="*.entity.ts" "export class" ./backend/src/ | wc -l)
UUID_ENTITIES=$(grep -r --include="*.entity.ts" "@PrimaryGeneratedColumn('uuid')" ./backend/src/ | wc -l)
INCREMENT_ENTITIES=$(grep -r --include="*.entity.ts" "@PrimaryGeneratedColumn()" ./backend/src/ | wc -l)

echo -e "Total entities: ${GREEN}$TOTAL_ENTITIES${NC}"
echo -e "UUID primary keys: ${GREEN}$UUID_ENTITIES${NC}"
echo -e "Auto-increment primary keys: ${GREEN}$INCREMENT_ENTITIES${NC}"

# Calculate consistency percentage
if [ "$TOTAL_ENTITIES" -gt 0 ]; then
  UUID_PERCENT=$((UUID_ENTITIES * 100 / TOTAL_ENTITIES))
  INCREMENT_PERCENT=$((INCREMENT_ENTITIES * 100 / TOTAL_ENTITIES))
  
  if [ "$UUID_PERCENT" -ge 75 ]; then
    echo -e "${GREEN}UUID is the dominant primary key type ($UUID_PERCENT%)${NC}"
    PRIMARY_KEY_RECOMMENDATION="UUID"
  elif [ "$INCREMENT_PERCENT" -ge 75 ]; then
    echo -e "${GREEN}Auto-increment is the dominant primary key type ($INCREMENT_PERCENT%)${NC}"
    PRIMARY_KEY_RECOMMENDATION="Auto-increment"
  else
    echo -e "${YELLOW}Mixed primary key types detected (UUID: $UUID_PERCENT%, Auto-increment: $INCREMENT_PERCENT%)${NC}"
    PRIMARY_KEY_RECOMMENDATION="Mixed"
  fi
fi

# Analyze foreign key naming patterns
echo -e "\n${BLUE}Analyzing Foreign Key Naming Patterns...${NC}"
USER_FK_WITH_ID=$(grep -r --include="*.entity.ts" "\<userId\>" ./backend/src/ | wc -l)
USER_FK_RELATION=$(grep -r --include="*.entity.ts" "@ManyToOne.* User" -A 5 ./backend/src/ | wc -l)
USER_FK_WITH_USER_ID=$(grep -r --include="*.entity.ts" "@Column.*userId\|@Column.*user_id" ./backend/src/ | wc -l)

echo -e "Foreign keys named 'userId': ${GREEN}$USER_FK_WITH_ID${NC}"
echo -e "User relations with @ManyToOne: ${GREEN}$USER_FK_RELATION${NC}"
echo -e "Explicitly defined userId columns: ${GREEN}$USER_FK_WITH_USER_ID${NC}"

# Analyze service layer ID usage
echo -e "\n${BLUE}Analyzing Service Layer ID Usage...${NC}"
grep -r --include="*.service.ts" "findOne.*id\|findById\|findOneBy.*id\|where.*id\|where.*Id" ./backend/src/ > "$SERVICES_FILE"

ID_PARAM_USAGE=$(grep -r --include="*.service.ts" "findOne(id:" ./backend/src/ | wc -l)
USERID_PARAM_USAGE=$(grep -r --include="*.service.ts" "findByUserId" ./backend/src/ | wc -l)
WHERE_ID_USAGE=$(grep -r --include="*.service.ts" "where:.*id:" ./backend/src/ | wc -l)
WHERE_USERID_USAGE=$(grep -r --include="*.service.ts" "where:.*userId:" ./backend/src/ | wc -l)

echo -e "Methods using 'id' parameter: ${GREEN}$ID_PARAM_USAGE${NC}"
echo -e "Methods using 'userId' parameter: ${GREEN}$USERID_PARAM_USAGE${NC}"
echo -e "Where clauses using 'id': ${GREEN}$WHERE_ID_USAGE${NC}"
echo -e "Where clauses using 'userId': ${GREEN}$WHERE_USERID_USAGE${NC}"

# Analyze controller layer ID usage
echo -e "\n${BLUE}Analyzing Controller Layer ID Usage...${NC}"
grep -r --include="*.controller.ts" "@Param.*id\|req.user.id\|req.user.userId" ./backend/src/ > "$CONTROLLERS_FILE"

PARAM_ID_USAGE=$(grep -r --include="*.controller.ts" "@Param.*id" ./backend/src/ | grep -v "userId\|ownerId\|creatorId" | wc -l)
PARAM_USERID_USAGE=$(grep -r --include="*.controller.ts" "@Param.*userId" ./backend/src/ | wc -l)
REQ_USER_ID_USAGE=$(grep -r --include="*.controller.ts" "req.user.id" ./backend/src/ | wc -l)
REQ_USER_USERID_USAGE=$(grep -r --include="*.controller.ts" "req.user.userId" ./backend/src/ | wc -l)

echo -e "Route parameters using 'id': ${GREEN}$PARAM_ID_USAGE${NC}"
echo -e "Route parameters using 'userId': ${GREEN}$PARAM_USERID_USAGE${NC}"
echo -e "Request using 'req.user.id': ${GREEN}$REQ_USER_ID_USAGE${NC}"
echo -e "Request using 'req.user.userId': ${GREEN}$REQ_USER_USERID_USAGE${NC}"

# Analyze DTO objects
echo -e "\n${BLUE}Analyzing DTO Objects...${NC}"
grep -r --include="*.dto.ts" "id: \|userId: \|ownerId: \|creatorId: " ./backend/src/ > "$DTOS_FILE"

DTO_ID_USAGE=$(grep -r --include="*.dto.ts" "\<id\>: " ./backend/src/ | wc -l)
DTO_USERID_USAGE=$(grep -r --include="*.dto.ts" "\<userId\>: " ./backend/src/ | wc -l)

echo -e "DTOs using 'id': ${GREEN}$DTO_ID_USAGE${NC}"
echo -e "DTOs using 'userId': ${GREEN}$DTO_USERID_USAGE${NC}"

# Generate recommendations
echo -e "\n${BLUE}Generating Recommendations...${NC}"

# Check if we have a JWT payload issue - sub vs id
echo -e "\n${YELLOW}JWT Payload Analysis:${NC}"
JWT_SUB_USAGE=$(grep -r --include="*.ts" "payload.sub\|{ sub: " ./backend/src/ | grep -v "node_modules" | wc -l)
JWT_ID_USAGE=$(grep -r --include="*.ts" "payload.id" ./backend/src/ | grep -v "node_modules" | wc -l)

if [ "$JWT_SUB_USAGE" -gt 0 ] && [ "$JWT_ID_USAGE" -gt 0 ]; then
  echo -e "${RED}INCONSISTENCY DETECTED: Mixed usage of payload.sub and payload.id in JWT handling${NC}"
  echo -e "Recommendation: Use 'sub' consistently as per JWT standards for subject identifier."
elif [ "$JWT_SUB_USAGE" -gt 0 ]; then
  echo -e "${GREEN}GOOD: Using JWT standard 'sub' field for subject identifier${NC}"
elif [ "$JWT_ID_USAGE" -gt 0 ]; then
  echo -e "${YELLOW}WARNING: Using non-standard 'id' field in JWT payload instead of 'sub'${NC}"
  echo -e "Recommendation: Consider changing to standard 'sub' field."
fi

# Check for req.user.id vs req.user.userId
echo -e "\n${YELLOW}Request User ID Access Pattern Analysis:${NC}"
if [ "$REQ_USER_ID_USAGE" -gt 0 ] && [ "$REQ_USER_USERID_USAGE" -gt 0 ]; then
  echo -e "${RED}INCONSISTENCY DETECTED: Mixed usage of req.user.id and req.user.userId${NC}"
  if [ "$REQ_USER_ID_USAGE" -gt "$REQ_USER_USERID_USAGE" ]; then
    echo -e "Recommendation: Standardize on req.user.id (currently more common with $REQ_USER_ID_USAGE uses)"
  else
    echo -e "Recommendation: Standardize on req.user.userId (currently more common with $REQ_USER_USERID_USAGE uses)"
  fi
elif [ "$REQ_USER_ID_USAGE" -gt 0 ]; then
  echo -e "${GREEN}CONSISTENT: Using req.user.id pattern ($REQ_USER_ID_USAGE uses)${NC}"
elif [ "$REQ_USER_USERID_USAGE" -gt 0 ]; then
  echo -e "${GREEN}CONSISTENT: Using req.user.userId pattern ($REQ_USER_USERID_USAGE uses)${NC}"
fi

# Primary key type recommendation
echo -e "\n${YELLOW}Primary Key Type Recommendation:${NC}"
if [ "$PRIMARY_KEY_RECOMMENDATION" = "UUID" ]; then
  echo -e "${GREEN}RECOMMENDATION: Continue using UUID for all primary keys${NC}"
  echo -e "UUID is already the dominant pattern ($UUID_PERCENT% of entities)"
elif [ "$PRIMARY_KEY_RECOMMENDATION" = "Auto-increment" ]; then
  echo -e "${GREEN}RECOMMENDATION: Continue using Auto-increment for all primary keys${NC}"
  echo -e "Auto-increment is already the dominant pattern ($INCREMENT_PERCENT% of entities)"
else
  echo -e "${RED}INCONSISTENCY DETECTED: Mixed primary key types${NC}"
  echo -e "Recommendation: Standardize on one primary key type (UUID recommended for distributed systems)"
fi

# Overall consistency score
echo -e "\n${BLUE}Calculating Overall ID Consistency Score...${NC}"

# Set initial score
SCORE=100

# Deduct points for inconsistencies
if [ "$PRIMARY_KEY_RECOMMENDATION" = "Mixed" ]; then
  SCORE=$((SCORE - 25))
fi

if [ "$JWT_SUB_USAGE" -gt 0 ] && [ "$JWT_ID_USAGE" -gt 0 ]; then
  SCORE=$((SCORE - 10))
fi

if [ "$REQ_USER_ID_USAGE" -gt 0 ] && [ "$REQ_USER_USERID_USAGE" -gt 0 ]; then
  SCORE=$((SCORE - 15))
fi

if [ "$DTO_ID_USAGE" -gt 0 ] && [ "$DTO_USERID_USAGE" -gt 0 ]; then
  SCORE=$((SCORE - 10))
fi

# Save recommendations to file
RECOMMENDATIONS_FILE="${PROJECT_ROOT}/id-consistency-recommendations.md"

{
  echo "# ID Field Consistency Recommendations"
  echo "Generated on: $(date)"
  echo
  echo "## Summary"
  echo
  echo "Overall Consistency Score: $SCORE/100"
  echo
  echo "## Key Findings"
  echo
  echo "### Primary Key Types"
  echo "- UUID primary keys: $UUID_ENTITIES"
  echo "- Auto-increment primary keys: $INCREMENT_ENTITIES"
  echo "- Dominant type: $PRIMARY_KEY_RECOMMENDATION"
  echo
  echo "### ID Field Usage Patterns"
  echo "- Methods using 'id' parameter: $ID_PARAM_USAGE"
  echo "- Methods using 'userId' parameter: $USERID_PARAM_USAGE"
  echo "- Controllers using req.user.id: $REQ_USER_ID_USAGE"
  echo "- Controllers using req.user.userId: $REQ_USER_USERID_USAGE"
  echo
  echo "## Recommendations"
  echo
  
  # Primary key recommendation
  if [ "$PRIMARY_KEY_RECOMMENDATION" = "Mixed" ]; then
    echo "1. **Standardize Primary Key Types**"
    echo "   - Current situation: Mixed use of UUID ($UUID_PERCENT%) and auto-increment ($INCREMENT_PERCENT%)"
    echo "   - Recommendation: Convert all entities to use UUID for better compatibility in distributed systems"
    echo
  fi
  
  # JWT recommendation
  if [ "$JWT_SUB_USAGE" -gt 0 ] && [ "$JWT_ID_USAGE" -gt 0 ]; then
    echo "2. **Standardize JWT Payload Fields**"
    echo "   - Current situation: Mixed use of payload.sub and payload.id for user identification"
    echo "   - Recommendation: Use 'sub' consistently as per JWT standards"
    echo
  elif [ "$JWT_ID_USAGE" -gt 0 ]; then
    echo "2. **Update JWT Payload Fields to Standard**"
    echo "   - Current situation: Using non-standard 'id' field instead of 'sub'"
    echo "   - Recommendation: Change to standard 'sub' field in JWT payloads"
    echo
  fi
  
  # req.user.id vs req.user.userId recommendation
  if [ "$REQ_USER_ID_USAGE" -gt 0 ] && [ "$REQ_USER_USERID_USAGE" -gt 0 ]; then
    echo "3. **Standardize User ID Access in Controllers**"
    if [ "$REQ_USER_ID_USAGE" -gt "$REQ_USER_USERID_USAGE" ]; then
      echo "   - Current situation: Mixed use of req.user.id ($REQ_USER_ID_USAGE uses) and req.user.userId ($REQ_USER_USERID_USAGE uses)"
      echo "   - Recommendation: Standardize on req.user.id as it's more commonly used"
    else
      echo "   - Current situation: Mixed use of req.user.id ($REQ_USER_ID_USAGE uses) and req.user.userId ($REQ_USER_USERID_USAGE uses)"
      echo "   - Recommendation: Standardize on req.user.userId as it's more commonly used"
    fi
    echo
  fi
  
  # DTO object recommendations
  if [ "$DTO_ID_USAGE" -gt 0 ] && [ "$DTO_USERID_USAGE" -gt 0 ]; then
    echo "4. **Standardize DTO Field Naming**"
    echo "   - Current situation: Mixed use of 'id' and 'userId' in DTOs"
    echo "   - Recommendation: Use consistent field naming in all DTOs"
    echo
  fi
  
  echo "## Implementation Plan"
  echo
  echo "1. **Update Entity ID Types**"
  echo "   - For any entities not using UUID, create migration to change column type"
  echo "   - Update entity classes to use consistent @PrimaryGeneratedColumn decorator"
  echo
  echo "2. **Standardize JWT Usage**"
  echo "   - Update JwtStrategy to use consistent field naming"
  echo "   - Update all services that interact with JWT payloads"
  echo
  echo "3. **Fix Controller ID References**"
  echo "   - Update all controllers to use consistent req.user.id access pattern"
  echo "   - Fix @Param decorators to use consistent naming"
  echo
  echo "4. **Update DTO Objects**"
  echo "   - Standardize field names across all DTOs"
  echo "   - Ensure CreateDTO and UpdateDTO have consistent naming"
  
} > "$RECOMMENDATIONS_FILE"

# Display score
if [ "$SCORE" -ge 90 ]; then
  echo -e "Overall ID Consistency Score: ${GREEN}$SCORE/100${NC} (Excellent)"
elif [ "$SCORE" -ge 75 ]; then
  echo -e "Overall ID Consistency Score: ${BLUE}$SCORE/100${NC} (Good)"
elif [ "$SCORE" -ge 60 ]; then
  echo -e "Overall ID Consistency Score: ${YELLOW}$SCORE/100${NC} (Needs Improvement)"
else
  echo -e "Overall ID Consistency Score: ${RED}$SCORE/100${NC} (Requires Attention)"
fi

echo -e "\n✅ Analysis complete!"
echo "======================================"
echo "Detailed recommendations saved to: ${RECOMMENDATIONS_FILE}"
echo "These recommendations should help you improve ID field consistency."
echo "======================================"
