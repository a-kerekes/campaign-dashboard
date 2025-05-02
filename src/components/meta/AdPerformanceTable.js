import React from 'react';

const AdPerformanceTable = ({ creativeData }) => {
  // Format currency values
  const formatCurrency = (value) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  // Format percentage values
  const formatPercent = (value) => {
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Calculate cost per click
  const calculateCPC = (spend, clicks) => {
    if (!clicks || clicks === 0) return '$0.00';
    return formatCurrency(spend / clicks);
  };

  // Calculate cost per purchase
  const calculateCostPerPurchase = (spend, purchases) => {
    if (!purchases || purchases === 0) return '$0.00';
    return formatCurrency(spend / purchases);
  };

  // Calculate ROAS
  const calculateROAS = (revenue, spend) => {
    if (!spend || spend === 0) return '0.00x';
    return `${(revenue / spend).toFixed(2)}x`;
  };

  // Helper to determine performance indicator
  const getPerformanceIndicator = (metric, threshold) => {
    if (metric >= threshold.good) return 'bg-green-100 text-green-800';
    if (metric >= threshold.average) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const thresholds = {
    ctr: { good: 3, average: 1 },
    cpc: { good: 1, average: 2 },
    convRate: { good: 10, average: 5 },
    roas: { good: 3, average: 1.5 }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
              Creative
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Impressions
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Clicks
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              CTR
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              CPC
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Purchases
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Conv. Rate
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost/Purchase
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Spend
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              ROAS
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {creativeData && creativeData.map((creative, index) => {
            // Calculate derived metrics
            const ctr = (creative.clicks / creative.impressions) * 100 || 0;
            const cpc = creative.clicks ? creative.spend / creative.clicks : 0;
            const convRate = creative.purchases && creative.clicks 
              ? (creative.purchases / creative.clicks) * 100 
              : 0;
            const costPerPurchase = creative.purchases 
              ? creative.spend / creative.purchases 
              : 0;
            const roas = creative.spend ? creative.revenue / creative.spend : 0;
            
            return (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 mr-4">
                      {creative.thumbnail && (
                        <img className="h-10 w-10 rounded-md object-cover" src={creative.thumbnail} alt="" />
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {creative.name || `Creative ${index + 1}`}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {creative.type || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {creative.impressions.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {creative.clicks.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPerformanceIndicator(ctr, thresholds.ctr)}`}>
                    {formatPercent(ctr)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(cpc)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {(creative.purchases || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPerformanceIndicator(convRate, thresholds.convRate)}`}>
                    {formatPercent(convRate)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(costPerPurchase)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(creative.spend)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(creative.revenue || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPerformanceIndicator(roas, thresholds.roas)}`}>
                    {calculateROAS(creative.revenue || 0, creative.spend)}
                  </span>
                </td>
              </tr>
            );
          })}
          
          {/* If no data or empty array */}
          {(!creativeData || creativeData.length === 0) && (
            <tr>
              <td colSpan="12" className="px-6 py-4 text-center text-sm text-gray-500">
                No creative data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdPerformanceTable;
