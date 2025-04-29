#!/bin/bash

echo "======================================"
echo "🔍 SEARCHING FOR ID FIELDS IN PROJECT"
echo "======================================"

# Set the project root directory
PROJECT_ROOT="/home/alivegod/Desktop/LastProject"
cd "$PROJECT_ROOT" || exit 1

echo -e "\n📋 Finding ID-related entity fields in TypeORM entities..."
echo "-----------------------------------------------------"
grep -r --include="*.entity.ts" "@PrimaryGeneratedColumn\|@Column.*id\|@Column.*Id\|id: \|userId: " --color=always ./backend/src/

echo -e "\n📋 Finding ID properties in TypeScript interfaces..."
echo "-----------------------------------------------------"
grep -r --include="*.ts" --include="*.tsx" --exclude="*.entity.ts" --exclude-dir="node_modules" "interface.*{" -A 15 | grep -E "^\s+(id|userId|_id|Id)(\?)?:" --color=always

echo -e "\n📋 Finding ID references in request handlers..."
echo "-----------------------------------------------------"
grep -r --include="*.controller.ts" --include="*.service.ts" "req.user.id\|req.user.userId\|user.id\|user.userId" --color=always ./backend/src/

echo -e "\n📋 Finding all ID-related database queries..."
echo "-----------------------------------------------------"
grep -r --include="*.service.ts" "findOne.*id\|findById\|findOneBy.*id\|where.*id\|where.*Id" --color=always ./backend/src/

echo -e "\n📋 Finding JWT payload with ID fields..."
echo "-----------------------------------------------------"
grep -r --include="*.ts" "sub: \|payload.sub\|payload.id\|payload.userId" --color=always ./backend/src/

echo -e "\n📋 Finding ID-related route parameters..."
echo "-----------------------------------------------------"
grep -r --include="*.controller.ts" "@Param.*id\|@Param.*Id" --color=always ./backend/src/

echo -e "\n📋 Finding mixed usage of id and userId..."
echo "-----------------------------------------------------"
grep -r --include="*.ts" "req.user.id.*userId\|userId.*req.user.id" --color=always ./backend/src/

echo -e "\n📋 Finding places where id might be renamed to userId..."
echo "-----------------------------------------------------"
grep -r --include="*.ts" "id: user.id\|userId: user.id\|id: req.user.id" --color=always ./backend/src/

echo -e "\n📋 Finding inconsistencies in DTO objects..."
echo "-----------------------------------------------------"
grep -r --include="*.dto.ts" "id: \|userId: " --color=always ./backend/src/

echo -e "\n✅ Search complete!"
echo "======================================"
echo "These results should help you find all places where id and userId are used."
echo "To find more specific patterns, you can modify this script accordingly."
echo "======================================"
