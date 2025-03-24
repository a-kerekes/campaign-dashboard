import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, ComposedChart, Line, PieChart, Pie } from 'recharts';

const RealTalkDashboard = () => {
  // Hook performance data (correctly scaled)
  const hookData = [
    {hook: "Expert Positioning", avgCost: 319.25, totalTrials: 631, percent: 43},
    {hook: "Speed/Automation", avgCost: 452.00, totalTrials: 218, percent: 15},
    {hook: "Anxiety/Insecurity", avgCost: 491.50, totalTrials: 449, percent: 30},
    {hook: "Conversation Starter", avgCost: 523.00, totalTrials: 182, percent: 12}
  ];
  
  // Creative type performance data (correctly scaled)
  const creativeData = [
    {type: "Video", avgCost: 405.38, totalTrials: 1080, percent: 73},
    {type: "Image", avgCost: 487.50, totalTrials: 400, percent: 27}
  ];
  
  // Awareness stage performance data (correctly scaled)
  const awarenessData = [
    {stage: "Solution Aware", avgCost: 387.00, totalTrials: 546, percent: 37},
    {stage: "Problem Aware", avgCost: 388.17, totalTrials: 788, percent: 53},
    {stage: "Unaware", avgCost: 658.00, totalTrials: 146, percent: 10}
  ];
  
  // Age breakdown data (corrected)
  const ageData = [
    { ageGroup: "18-24", trials: 96, costPerTrial: 454, percentage: 6.5 },
    { ageGroup: "25-34", trials: 331, costPerTrial: 402, percentage: 22.5 },
    { ageGroup: "35-44", trials: 456, costPerTrial: 362, percentage: 31.0 },
    { ageGroup: "45-54", trials: 368, costPerTrial: 368, percentage: 25.0 },
    { ageGroup: "55-64", trials: 177, costPerTrial: 389, percentage: 12.0 },
    { ageGroup: "65+", trials: 45, costPerTrial: 439, percentage: 3.0 }
  ];
  
  // Gender breakdown data (corrected)
  const genderData = [
    { gender: "Female", trials: 1133, costPerTrial: 368, percentage: 77 },
    { gender: "Male", trials: 340, costPerTrial: 412, percentage: 23 }
  ];
  
  // Top performing demographic segments (corrected with actual age/gender data)
  const topSegmentsData = [
    { segment: "Female 35-44", trials: 351, costPerTrial: 350, percentage: 23.8 },
    { segment: "Female 45-54", trials: 283, costPerTrial: 357, percentage: 19.2 },
    { segment: "Female 25-34", trials: 255, costPerTrial: 386, percentage: 17.3 },
    { segment: "Female 55-64", trials: 136, costPerTrial: 375, percentage: 9.2 },
    { segment: "Male 35-44", trials: 105, costPerTrial: 391, percentage: 7.1 },
    { segment: "Male 45-54", trials: 85, costPerTrial: 400, percentage: 5.8 }
  ];
  
  // Color constants
  const colors = {
    primary: '#0088FE',
    secondary: '#00C49F',
    tertiary: '#FFBB28',
    quaternary: '#FF8042',
    cost: '#FF4560',
    trials: '#00C49F',
    male: '#0088FE',
    female: '#FF6B8A'
  };
  
  // Hook colors for consistent representation
  const hookColors = {
    "Expert Positioning": '#0088FE',
    "Speed/Automation": '#00C49F',
    "Anxiety/Insecurity": '#FFBB28',
    "Conversation Starter": '#FF8042'
  };
  
  // Age group colors
  const ageColors = [
    "#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#ffc658", "#ff8042"
  ];
  
  // Gender colors
  const genderColors = [colors.female, colors.male];
  
  // Overall average cost per trial across all ads
  const overallAvgCost = 393.98;
  
  // More explicit chart container style that's working
  const chartContainerStyle = {
    width: '100%',
    height: '400px',
    position: 'relative',
    display: 'block',
    minHeight: '400px'
  };
  
  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">Trials: {payload[0].value} ({payload[0].payload.percent}%)</p>
          <p className="text-sm">Cost/Trial: ${payload[0].payload.avgCost}</p>
        </div>
      );
    }
    return null;
  };
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-center">RealTalk Meta Ads Performance Analysis</h1>
      <p className="text-center text-gray-700">Based on 1,480 total trials started and $583,091 in ad spend</p>
      
      {/* Performance Matrix: Cost vs. Volume */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">RealTalk Performance Matrix: Cost vs. Volume</h2>
        <p className="text-sm text-gray-600 mb-4">
          Bubble size represents number of trials started (larger = more trials)
        </p>
        <div style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="totalTrials" name="Total Trials" domain={[0, 700]} 
                     label={{ value: 'Total Trials Started', position: 'bottom', offset: 5 }} />
              <YAxis type="number" dataKey="avgCost" name="Avg. Cost per Trial" domain={[250, 600]} 
                     label={{ value: 'Cost per Trial ($)', angle: -90, position: 'insideLeft', offset: -5 }} />
              <ZAxis type="number" range={[200, 600]} dataKey="totalTrials" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 border border-gray-200 shadow-sm rounded">
                        <p className="font-medium">{payload[0].payload.hook}</p>
                        <p>Total Trials: {payload[0].payload.totalTrials}</p>
                        <p>Cost per Trial: ${payload[0].payload.avgCost}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
              <Scatter name="Hooks" data={hookData} fill="#8884d8">
                {hookData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={hookColors[entry.hook]} />
                ))}
              </Scatter>
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-sm text-gray-700">
          <div className="flex flex-wrap">
            <div className="w-1/2">
              <p className="font-medium text-blue-600">Expert Positioning (blue):</p>
              <p>Best performance - lowest cost ($319) & highest volume (631 trials)</p>
            </div>
            <div className="w-1/2">
              <p className="font-medium text-yellow-600">Anxiety/Insecurity (yellow):</p>
              <p>High volume (449 trials) but higher cost ($492/trial)</p>
            </div>
            <div className="w-1/2 mt-2">
              <p className="font-medium text-green-600">Speed/Automation (green):</p>
              <p>Moderate cost ($452), lower volume (218 trials)</p>
            </div>
            <div className="w-1/2 mt-2">
              <p className="font-medium text-orange-600">Conversation Starter (orange):</p>
              <p>Highest cost ($523), lowest volume (182 trials)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Awareness Stage Performance Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Audience Awareness Stage Performance</h2>
        <p className="text-sm text-gray-600 mb-4">
          Comparing performance metrics across different audience awareness stages
        </p>
        <div style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={awarenessData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis yAxisId="left" orientation="left" stroke={colors.cost} domain={[0, 700]} label={{ value: 'Cost per Trial ($)', angle: -90, position: 'insideLeft', offset: -5 }} />
              <YAxis yAxisId="right" orientation="right" stroke={colors.trials} domain={[0, 900]} label={{ value: 'Trials Started', angle: 90, position: 'insideRight', offset: 5 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar yAxisId="right" dataKey="totalTrials" name="Total Trials Started" fill={colors.trials} barSize={60} />
              <Line yAxisId="left" type="monotone" dataKey="avgCost" name="Avg. Cost per Trial ($)" stroke={colors.cost} strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-sm text-gray-700">
          <p className="font-medium">Key Insight: Problem Aware audiences generated the most trials (788, 53% of total), while Solution Aware audiences had the lowest cost per trial ($387.00). Unaware audiences were 70% more expensive to convert.</p>
        </div>
      </div>

      {/* Creative Type Performance Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Creative Type Performance</h2>
        <p className="text-sm text-gray-600 mb-4">
          Comparing video vs. image ad performance in terms of cost and volume
        </p>
        <div style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={creativeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barSize={60}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis yAxisId="left" orientation="left" stroke={colors.cost} domain={[0, 600]} label={{ value: 'Cost per Trial ($)', angle: -90, position: 'insideLeft', offset: -5 }} />
              <YAxis yAxisId="right" orientation="right" stroke={colors.trials} domain={[0, 1200]} label={{ value: 'Trials Started', angle: 90, position: 'insideRight', offset: 5 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar yAxisId="left" dataKey="avgCost" name="Avg. Cost per Trial ($)" fill={colors.cost} />
              <Bar yAxisId="right" dataKey="totalTrials" name="Total Trials Started" fill={colors.trials} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-sm text-gray-700">
          <p className="font-medium">Key Insight: Video ads account for 73% of all trials (1,080) and have a 17% lower cost per trial than image ads ($405.38 vs $487.50).</p>
        </div>
      </div>
      
      {/* Overview: Distribution of Trials */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Distribution of Trials by Hook Type</h2>
        <p className="text-sm text-gray-600 mb-4">
          Total trials started: 1,480
        </p>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 w-full" style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hookData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={null}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalTrials"
                  nameKey="hook"
                >
                  {hookData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={hookColors[entry.hook]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="md:w-1/2 w-full" style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hookData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="hook" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="totalTrials" fill="#82ca9d" name="Total Trials Started">
                  {hookData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={hookColors[entry.hook]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-700">
          <p className="font-medium">Key Insight: Expert Positioning drove 43% of all trials (631), making it the most effective hook by volume.</p>
        </div>
      </div>
      
      {/* Age Group Analysis */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Age Group Performance</h2>
        <p className="text-sm text-gray-600 mb-4">
          Comparing performance across different age segments
        </p>
        <div style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={ageData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageGroup" />
              <YAxis yAxisId="left" orientation="left" stroke={colors.cost} domain={[300, 550]} label={{ value: 'Cost per Trial ($)', angle: -90, position: 'insideLeft', offset: -5 }} />
              <YAxis yAxisId="right" orientation="right" stroke={colors.trials} domain={[0, 500]} label={{ value: 'Trials Started', angle: 90, position: 'insideRight', offset: 5 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar yAxisId="right" dataKey="trials" name="Total Trials Started" fill={colors.trials} barSize={40}>
                {ageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ageColors[index]} />
                ))}
              </Bar>
              <Line yAxisId="left" type="monotone" dataKey="costPerTrial" name="Cost per Trial ($)" stroke={colors.cost} strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-sm text-gray-700">
          <p className="font-medium">Key Insight: The 35-44 age group delivers the best performance with both the lowest cost per trial ($362) and highest volume (456 trials, 31% of total).</p>
        </div>
      </div>
      
      {/* Gender Analysis */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Gender Performance Comparison</h2>
        <p className="text-sm text-gray-600 mb-4">
          Comparing performance metrics between male and female audiences
        </p>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 w-full" style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="trials"
                  nameKey="gender"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={genderColors[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-sm font-medium">Trial Distribution by Gender</p>
          </div>
          <div className="md:w-1/2 w-full" style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={genderData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={60}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gender" />
                <YAxis domain={[0, 450]} label={{ value: 'Cost per Trial ($)', angle: -90, position: 'insideLeft', offset: -5 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="costPerTrial" name="Cost per Trial ($)" fill={colors.cost}>
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={genderColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-center text-sm font-medium">Cost Efficiency by Gender</p>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-700">
          <p className="font-medium">Key Insight: Female audiences dominate with 77% of all trials and are 10.7% more cost-efficient than male audiences ($368 vs $412 per trial).</p>
        </div>
      </div>
      
      {/* Top Performing Segments */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Top Performing Age/Gender Segments</h2>
        <p className="text-sm text-gray-600 mb-4">
          Detailed analysis of performance by combined age and gender segments
        </p>
        <div style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topSegmentsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" angle={-15} textAnchor="end" height={60} />
              <YAxis yAxisId="left" orientation="left" stroke={colors.cost} domain={[300, 450]} label={{ value: 'Cost per Trial ($)', angle: -90, position: 'insideLeft', offset: -5 }} />
              <YAxis yAxisId="right" orientation="right" stroke={colors.trials} domain={[0, 400]} label={{ value: 'Trials Started', angle: 90, position: 'insideRight', offset: 5 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar yAxisId="left" dataKey="costPerTrial" name="Cost per Trial ($)" fill={colors.cost} />
              <Bar yAxisId="right" dataKey="trials" name="Trials Started" fill={colors.trials} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-sm text-gray-700">
          <p className="font-medium">Key Insights:</p>
          <ul className="list-disc pl-5 mt-1">
            <li><span className="font-medium">Female 35-44</span>: Highest volume and most cost-efficient segment (351 trials, 23.8% of total, $350/trial)</li>
            <li><span className="font-medium">Female 25-34</span>: 17.3% of total trials (255), indicating strong appeal to younger female agents</li>
            <li><span className="font-medium">Female demographics</span>: Top 4 highest-volume segments are all female, reinforcing the 77% female audience majority</li>
          </ul>
        </div>
      </div>

      {/* Strategic Recommendations */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Strategic Recommendations for April Promo</h2>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
            <h3 className="font-medium">Offer Structure (Aligned with Brief):</h3>
            <p>14-day Elite Trial + Video Masterclass bonus</p>
            <p className="text-sm text-gray-600 mt-1">The Video Masterclass directly addresses confidence issues while supporting the "Expert Positioning" messaging that drives the most trials at lowest cost.</p>
          </div>
          
          <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
            <h3 className="font-medium">Budget Allocation:</h3>
            <p><strong>45%:</strong> Female audiences ages 35-44 (23.8% of total trials, lowest cost at $350/trial)</p>
            <p><strong>30%:</strong> Female audiences ages 45-54 (19.2% of total trials, $357/trial)</p>
            <p><strong>20%:</strong> Female audiences ages 25-34 (17.3% of total trials, $386/trial)</p>
            <p><strong>5%:</strong> Female audiences ages 55-64 (9.2% of total trials, $375/trial)</p>
          </div>
          
          <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
            <h3 className="font-medium">Messaging Strategy:</h3>
            <p><strong>Primary Hook:</strong> Expert Positioning (lowest cost at $319/trial)</p>
            <p><strong>Secondary Hook:</strong> Anxiety/Insecurity (addresses confidence issues)</p>
            <p><strong>Format:</strong> 15-second video ads (outperform images by 17%)</p>
            <p><strong>Target:</strong> Problem Aware and Solution Aware audiences (90% of trials)</p>
          </div>
          
          <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
            <h3 className="font-medium">Campaign Timeline (April 14-21):</h3>
            <p><strong>Now-March 22:</strong> Finalize Video Masterclass bonus</p>
            <p><strong>March 23-29:</strong> Create video assets with Expert Positioning focus</p>
            <p><strong>April 1-7:</strong> Launch test ads to optimize performance</p>
            <p><strong>April 8-13:</strong> Scale up top performers and prepare full campaign</p>
            <p><strong>April 14-21:</strong> Run full campaign with daily optimization</p>
            <p className="text-sm text-gray-600 mt-1">Goal of 100 trials is achievable based on historical performance data.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTalkDashboard;
