#!/usr/bin/env node

/**
 * ROI Calculator Algorithm Simulation
 * Tests the current algorithm against various business scenarios
 */

// Current algorithm (copied from React component)
function calculateROI(inputs) {
  const { currentRevenue, currentCosts, teamSize, timeSpentHours } = inputs;
  
  // Conservative calculations based on realistic improvements
  const aiPlatformCost = 199; // Monthly cost
  const hourlyRate = 150; // Average cost per hour for team time
  
  // Time savings: AI can save 40-60% of time spent on content/analysis
  const timeFreedHours = timeSpentHours * 0.5; // 50% time savings (conservative)
  const monthlyCostSavings = timeFreedHours * hourlyRate;
  
  // Additional cost savings: reducing need for external tools/agencies
  const toolsSavings = Math.min(currentCosts * 0.15, 1500); // 15% cost reduction, max 1500 PLN
  
  const totalMonthlySavings = monthlyCostSavings + toolsSavings;
  const netMonthlySavings = totalMonthlySavings - aiPlatformCost;
  const annualSavings = netMonthlySavings * 12;
  
  // Payback period in months
  const paybackMonths = netMonthlySavings > 0 ? aiPlatformCost / netMonthlySavings : 12;

  return {
    monthlySavings: Math.round(Math.max(0, netMonthlySavings)),
    annualSavings: Math.round(Math.max(0, annualSavings)),
    timeFreed: Math.round(timeFreedHours),
    paybackMonths: Math.round(paybackMonths * 10) / 10,
    // Additional analysis data
    timeCostSavings: Math.round(monthlyCostSavings),
    toolsSavings: Math.round(toolsSavings),
    totalSavings: Math.round(totalMonthlySavings),
    platformCostRatio: Math.round((aiPlatformCost / currentRevenue) * 100 * 100) / 100 // % of revenue
  };
}

// Test scenarios covering different business sizes
const testScenarios = [
  // Micro businesses
  { name: "Freelancer", currentRevenue: 5000, currentCosts: 1000, teamSize: 1, timeSpentHours: 10 },
  { name: "Solo Consultant", currentRevenue: 8000, currentCosts: 1500, teamSize: 1, timeSpentHours: 15 },
  { name: "Micro Agency", currentRevenue: 12000, currentCosts: 2500, teamSize: 1, timeSpentHours: 20 },
  
  // Small businesses  
  { name: "Small Agency", currentRevenue: 25000, currentCosts: 5000, teamSize: 2, timeSpentHours: 30 },
  { name: "Growing Startup", currentRevenue: 35000, currentCosts: 8000, teamSize: 3, timeSpentHours: 40 },
  { name: "Small Company", currentRevenue: 50000, currentCosts: 12000, teamSize: 4, timeSpentHours: 50 },
  
  // Medium businesses
  { name: "Medium Company", currentRevenue: 75000, currentCosts: 18000, teamSize: 5, timeSpentHours: 60 },
  { name: "Established Business", currentRevenue: 100000, currentCosts: 22000, teamSize: 6, timeSpentHours: 70 },
  { name: "Growth Business", currentRevenue: 150000, currentCosts: 28000, teamSize: 8, timeSpentHours: 80 },
  
  // Larger businesses
  { name: "Large Company", currentRevenue: 200000, currentCosts: 30000, teamSize: 10, timeSpentHours: 90 },
];

console.log("🧮 ROI Calculator Algorithm Analysis");
console.log("=====================================\n");

console.log("Current Algorithm Parameters:");
console.log("- Platform cost: 199 PLN/month");
console.log("- Time savings: 50% of input hours");
console.log("- Hourly rate: 150 PLN/hour");
console.log("- Tools savings: 15% of costs (max 1,500 PLN)");
console.log("- Net savings: Total savings - platform cost\n");

console.log("Test Results:");
console.log("-".repeat(120));
console.log(
  "Business Type".padEnd(18) + 
  "Revenue".padEnd(10) + 
  "Costs".padEnd(8) + 
  "Hours".padEnd(7) + 
  "Time↓".padEnd(7) +
  "Time€".padEnd(8) + 
  "Tools€".padEnd(8) + 
  "Net€".padEnd(8) + 
  "Annual€".padEnd(10) + 
  "Payback".padEnd(9) +
  "Platform%"
);
console.log("-".repeat(120));

let issues = [];

testScenarios.forEach(scenario => {
  const result = calculateROI(scenario);
  
  // Format output
  const row = 
    scenario.name.padEnd(18) + 
    `${(scenario.currentRevenue/1000).toFixed(0)}k`.padEnd(10) +
    `${(scenario.currentCosts/1000).toFixed(1)}k`.padEnd(8) +
    `${scenario.timeSpentHours}h`.padEnd(7) +
    `${result.timeFreed}h`.padEnd(7) +
    `${result.timeCostSavings}`.padEnd(8) +
    `${result.toolsSavings}`.padEnd(8) +
    `${result.monthlySavings}`.padEnd(8) +
    `${(result.annualSavings/1000).toFixed(0)}k`.padEnd(10) +
    `${result.paybackMonths}m`.padEnd(9) +
    `${result.platformCostRatio}%`;
    
  console.log(row);
  
  // Identify potential issues
  if (result.paybackMonths < 0.5) {
    issues.push(`⚠️  ${scenario.name}: Payback too fast (${result.paybackMonths} months) - unrealistic`);
  }
  if (result.platformCostRatio > 10) {
    issues.push(`⚠️  ${scenario.name}: Platform cost is ${result.platformCostRatio}% of revenue - too high`);
  }
  if (result.monthlySavings > scenario.currentCosts * 0.5) {
    issues.push(`⚠️  ${scenario.name}: Monthly savings (${result.monthlySavings}) > 50% of current costs - unrealistic`);
  }
  if (result.monthlySavings <= 0) {
    issues.push(`⚠️  ${scenario.name}: No positive savings - platform not viable`);
  }
});

console.log("\n" + "=".repeat(120));
console.log("ANALYSIS SUMMARY");
console.log("=".repeat(120));

if (issues.length > 0) {
  console.log("\n🚨 ISSUES IDENTIFIED:");
  issues.forEach(issue => console.log(issue));
} else {
  console.log("\n✅ No major issues identified with current algorithm");
}

console.log("\n📊 ALGORITHM OBSERVATIONS:");

console.log("\n1. TIME SAVINGS:");
console.log("   - All scenarios show 50% time reduction");
console.log("   - Generates 750-6,750 PLN in time savings");
console.log("   - 150 PLN/hour rate may be too high for micro businesses");

console.log("\n2. TOOLS SAVINGS:");
console.log("   - Ranges from 150-1,500 PLN (15% of costs, capped)");  
console.log("   - Cap kicks in at 10k+ monthly costs");
console.log("   - May be unrealistic for very low-cost businesses");

console.log("\n3. PAYBACK PERIODS:");
const paybackPeriods = testScenarios.map(s => calculateROI(s).paybackMonths);
const avgPayback = paybackPeriods.reduce((a,b) => a+b, 0) / paybackPeriods.length;
const minPayback = Math.min(...paybackPeriods);
const maxPayback = Math.max(...paybackPeriods);
console.log(`   - Range: ${minPayback}-${maxPayback} months`);
console.log(`   - Average: ${avgPayback.toFixed(1)} months`);

console.log("\n4. PLATFORM COST IMPACT:");
const platformRatios = testScenarios.map(s => calculateROI(s).platformCostRatio);
const avgRatio = platformRatios.reduce((a,b) => a+b, 0) / platformRatios.length;
console.log(`   - Platform cost as % of revenue: ${Math.min(...platformRatios)}-${Math.max(...platformRatios)}%`);
console.log(`   - Average impact: ${avgRatio.toFixed(1)}%`);

console.log("\n💡 RECOMMENDATIONS:");
console.log("1. Consider sliding hourly rates (80-150 PLN based on business size)");
console.log("2. Adjust time savings percentage (30-40% for micro, 50% for larger)");  
console.log("3. Review tools savings formula for low-cost businesses");
console.log("4. Consider minimum viable business size (maybe 8k+ revenue)");

console.log("\n🎯 NEXT STEPS:");
console.log("1. Implement refined algorithm with sliding scales");
console.log("2. Re-run simulation with new parameters");
console.log("3. Validate results make business sense");
console.log("4. Update React component with final algorithm");