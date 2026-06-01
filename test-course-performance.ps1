# Performance Testing Script for Course Loading (Windows PowerShell)
# Tests API response times before and after optimization

Write-Host "🚀 Course Loading Performance Test" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test configuration
$API_URL = "https://millerstorm.tech/api/courses"
$USER_ID = "test-user-id"  # Replace with actual user ID
$USER_ROLE = "sales"
$ITERATIONS = 5

Write-Host "📊 Configuration:" -ForegroundColor Yellow
Write-Host "  API URL: $API_URL"
Write-Host "  User ID: $USER_ID"
Write-Host "  Iterations: $ITERATIONS"
Write-Host ""

# Function to test API response time
function Test-API {
    param(
        [string]$Url,
        [string]$Name
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Cyan
    Write-Host "URL: $Url"
    
    $times = @()
    
    for ($i = 1; $i -le $ITERATIONS; $i++) {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        try {
            $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 30
            $stopwatch.Stop()
            
            $ms = $stopwatch.ElapsedMilliseconds
            $times += $ms
            
            Write-Host "  Attempt $i: ${ms}ms" -ForegroundColor Gray
        }
        catch {
            $stopwatch.Stop()
            Write-Host "  Attempt $i: ERROR - $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Small delay between requests
        Start-Sleep -Milliseconds 500
    }
    
    if ($times.Count -gt 0) {
        $avg = ($times | Measure-Object -Average).Average
        $min = ($times | Measure-Object -Minimum).Minimum
        $max = ($times | Measure-Object -Maximum).Maximum
        
        Write-Host ""
        Write-Host "📈 Results:" -ForegroundColor Yellow
        Write-Host "  Average: $([math]::Round($avg, 2))ms"
        Write-Host "  Min: ${min}ms"
        Write-Host "  Max: ${max}ms"
        Write-Host ""
        
        # Performance rating
        if ($avg -lt 500) {
            Write-Host "  ✅ EXCELLENT - Very fast response" -ForegroundColor Green
        }
        elseif ($avg -lt 1000) {
            Write-Host "  ✅ GOOD - Fast response" -ForegroundColor Green
        }
        elseif ($avg -lt 2000) {
            Write-Host "  ⚠️  ACCEPTABLE - Could be faster" -ForegroundColor Yellow
        }
        else {
            Write-Host "  ❌ SLOW - Needs optimization" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  ❌ All requests failed" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host ""
}

# Test 1: Course list API
Write-Host "Test 1: Course List API" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan
Test-API -Url "${API_URL}?userId=${USER_ID}&userRole=${USER_ROLE}" -Name "Course List"

# Test 2: Course detail API (if you have a course ID)
# Uncomment and replace COURSE_ID with actual ID
# Write-Host "Test 2: Course Detail API" -ForegroundColor Cyan
# Write-Host "------------------------" -ForegroundColor Cyan
# $COURSE_ID = "your-course-id"
# Test-API -Url "${API_URL}/${COURSE_ID}?userId=${USER_ID}" -Name "Course Detail"

# Test 3: Progress API
Write-Host "Test 3: Progress API" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan
Test-API -Url "https://millerstorm.tech/api/course-progress?userId=${USER_ID}&courseIds=course1,course2" -Name "Course Progress"

Write-Host "✅ Performance testing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  - Response times under 500ms are excellent"
Write-Host "  - Response times under 1s are good"
Write-Host "  - Response times over 2s need optimization"
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Compare results before and after optimization"
Write-Host "  2. Test with different network conditions"
Write-Host "  3. Test with multiple concurrent users"
Write-Host "  4. Monitor in production with real traffic"
