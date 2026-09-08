#!/bin/bash
# LVIGS Mart Load Testing Script
# Usage: ./load-test.sh [base_url] [concurrent_users] [duration_seconds]
# Requires: hey (go install github.com/rakyll/hey@latest)

set -e

BASE_URL="${1:-http://localhost:4000}"
CONCURRENT="${2:-10}"
DURATION="${3:-30}"
RESULTS_DIR="./results/$(date +%Y%m%d_%H%M%S)"

mkdir -p "$RESULTS_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  LVIGS Mart Load Test${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "Target:      ${GREEN}$BASE_URL${NC}"
echo -e "Concurrent:  ${GREEN}$CONCURRENT${NC}"
echo -e "Duration:    ${GREEN}${DURATION}s${NC}"
echo -e "Results:     ${GREEN}$RESULTS_DIR${NC}"
echo -e "${CYAN}========================================${NC}"

# Check if hey is installed
if ! command -v hey &> /dev/null; then
    echo -e "${YELLOW}Installing hey load testing tool...${NC}"
    go install github.com/rakyll/hey@latest 2>/dev/null || {
        echo -e "${RED}Error: 'hey' not found. Install with: go install github.com/rakyll/hey@latest${NC}"
        exit 1
    }
fi

# Check if server is reachable
echo -e "\n${YELLOW}Checking server connectivity...${NC}"
if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" | grep -q "200"; then
    echo -e "${RED}Warning: Server at $BASE_URL may not be running${NC}"
    echo "Continuing anyway..."
fi

run_test() {
    local name="$1"
    local url="$2"
    local n="${3:-100}"
    local c="${4:-$CONCURRENT}"
    local output="$RESULTS_DIR/${name}.txt"

    echo -e "\n${YELLOW}Testing: $name${NC}"
    echo "URL: $url"
    echo "Requests: $n | Concurrent: $c"

    hey -n "$n" -c "$c" -o csv "$url" > "$RESULTS_DIR/${name}_raw.csv" 2>/dev/null || true
    hey -n "$n" -c "$c" "$url" 2>&1 | tee "$output"

    # Extract p50, p95, p99 from output
    local p50=$(grep "50% in" "$output" 2>/dev/null | awk '{print $3}' || echo "N/A")
    local p95=$(grep "95% in" "$output" 2>/dev/null | awk '{print $3}' || echo "N/A")
    local rps=$(grep "Requests/sec:" "$output" 2>/dev/null | awk '{print $2}' || echo "N/A")
    local status=$(grep "\[200\]" "$output" 2>/dev/null | awk '{print $2}' || echo "0")

    echo -e "  ${GREEN}RPS: $rps | P50: ${p50}s | P95: ${p95}s | 200s: $status${NC}"
}

echo -e "\n${CYAN}--- Phase 1: Health & Infrastructure ---${NC}"
run_test "01_health" "$BASE_URL/api/health" 200 5

echo -e "\n${CYAN}--- Phase 2: Public Endpoints ---${NC}"
run_test "02_banners_active" "$BASE_URL/api/banners/active" 300 "$CONCURRENT"
run_test "03_products_list" "$BASE_URL/api/products?limit=20" 300 "$CONCURRENT"
run_test "04_products_categories" "$BASE_URL/api/products/categories" 100 5
run_test "05_products_brands" "$BASE_URL/api/products/brands" 100 5

echo -e "\n${CYAN}--- Phase 3: Search ---${NC}"
run_test "06_search_phone" "$BASE_URL/api/search?q=phone" 200 "$CONCURRENT"
run_test "07_search_wireless" "$BASE_URL/api/search?q=wireless" 200 "$CONCURRENT"
run_test "08_search_suggestions" "$BASE_URL/api/search/suggest?q=lap" 100 5

echo -e "\n${CYAN}--- Phase 4: Product Detail (simulate) ---${NC}"
run_test "09_product_detail" "$BASE_URL/api/products?limit=1" 100 "$CONCURRENT"

echo -e "\n${CYAN}--- Phase 5: Offers & Flash Sales ---${NC}"
run_test "10_offers_active" "$BASE_URL/api/banners/offers/active" 200 "$CONCURRENT"
run_test "11_flash_sales" "$BASE_URL/api/banners/flash-sales/active" 100 5

echo -e "\n${CYAN}========================================${NC}"
echo -e "${GREEN}  Load Test Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "Results saved to: $RESULTS_DIR"
echo ""
echo "Summary files:"
ls -la "$RESULTS_DIR"/*.txt 2>/dev/null || echo "No summary files found"
