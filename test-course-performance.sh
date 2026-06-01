#!/bin/bash

# Performance Testing Script for Course Loading
# Tests API response times before and after optimization

echo "🚀 Course Loading Performance Test"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
API_URL="https://millerstorm.tech/api/courses"
USER_ID="test-user-id"  # Replace with actual user ID
USER_ROLE="sales"
ITERATIONS=5

echo "📊 Configuration:"
echo "  API URL: $API_URL"
echo "  User ID: $USER_ID"
echo "  Iterations: $ITERATIONS"
echo ""

# Function to test API response time
test_api() {
    local url="$1"
    local name="$2"
    
    echo "Testing: $name"
    echo "URL: $url"
    
    total_time=0
    min_time=999999
    max_time=0
    
    for i in $(seq 1 $ITERATIONS); do
        # Measure response time
        response_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$url")
        
        # Convert to milliseconds
        ms=$(echo "$response_time * 1000" | bc)
        
        echo "  Attempt $i: ${ms}ms"
        
        # Update stats
        total_time=$(echo "$total_time + $response_time" | bc)
        
        if (( $(echo "$response_time < $min_time" | bc -l) )); then
            min_time=$response_time
        fi
        
        if (( $(echo "$response_time > $max_time" | bc -l) )); then
            max_time=$response_time
        fi
        
        # Small delay between requests
        sleep 0.5
    done
    
    # Calculate average
    avg_time=$(echo "scale=3; $total_time / $ITERATIONS" | bc)
    avg_ms=$(echo "$avg_time * 1000" | bc)
    min_ms=$(echo "$min_time * 1000" | bc)
    max_ms=$(echo "$max_time * 1000" | bc)
    
    echo ""
    echo "📈 Results:"
    echo "  Average: ${avg_ms}ms"
    echo "  Min: ${min_ms}ms"
    echo "  Max: ${max_ms}ms"
    echo ""
    
    # Performance rating
    if (( $(echo "$avg_time < 0.5" | bc -l) )); then
        echo -e "  ${GREEN}✅ EXCELLENT${NC} - Very fast response"
    elif (( $(echo "$avg_time < 1.0" | bc -l) )); then
        echo -e "  ${GREEN}✅ GOOD${NC} - Fast response"
    elif (( $(echo "$avg_time < 2.0" | bc -l) )); then
        echo -e "  ${YELLOW}⚠️  ACCEPTABLE${NC} - Could be faster"
    else
        echo -e "  ${RED}❌ SLOW${NC} - Needs optimization"
    fi
    echo ""
    echo "=================================="
    echo ""
}

# Test 1: Course list API
echo "Test 1: Course List API"
echo "------------------------"
test_api "${API_URL}?userId=${USER_ID}&userRole=${USER_ROLE}" "Course List"

# Test 2: Course detail API (if you have a course ID)
# Uncomment and replace COURSE_ID with actual ID
# echo "Test 2: Course Detail API"
# echo "------------------------"
# COURSE_ID="your-course-id"
# test_api "${API_URL}/${COURSE_ID}?userId=${USER_ID}" "Course Detail"

# Test 3: Progress API
echo "Test 3: Progress API"
echo "------------------------"
test_api "https://millerstorm.tech/api/course-progress?userId=${USER_ID}&courseIds=course1,course2" "Course Progress"

echo "✅ Performance testing complete!"
echo ""
echo "💡 Tips:"
echo "  - Response times under 500ms are excellent"
echo "  - Response times under 1s are good"
echo "  - Response times over 2s need optimization"
echo ""
echo "📝 Next steps:"
echo "  1. Compare results before and after optimization"
echo "  2. Test with different network conditions"
echo "  3. Test with multiple concurrent users"
echo "  4. Monitor in production with real traffic"
