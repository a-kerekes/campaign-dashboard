// src/components/meta/CreativePreview.js
import React from 'react';

const CreativePreview = ({ creative }) => {
  if (!creative) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <p className="text-gray-500">Select a creative to preview</p>
      </div>
    );
  }

  // Extract thumbnail URL
  const thumbnailUrl = creative.thumbnail || 
    (creative.creative && creative.creative.thumbnail_url) || 
    null;

  // Extract creative details for display
  const getCreativeContent = () => {
    if (!creative.creativeDetails) {
      return {
        headline: 'No headline available',
        description: 'No description available',
        callToAction: 'No CTA available'
      };
    }

    const details = creative.creativeDetails;
    let headline = 'No headline available';
    let description = 'No description available';
    let callToAction = 'No CTA available';

    // Try to extract data from link_data or video_data
    if (details.link_data) {
      headline = details.link_data.title || details.link_data.message || 'No headline available';
      description = details.link_data.description || details.link_data.caption || 'No description available';
      callToAction = details.link_data.call_to_action?.type || 'No CTA available';
    } else if (details.video_data) {
      headline = details.video_data.title || details.video_data.message || 'No headline available';
      description = details.video_data.description || 'No description available';
      callToAction = details.video_data.call_to_action?.type || 'No CTA available';
    }

    return { headline, description, callToAction };
  };

  const { headline, description, callToAction } = getCreativeContent();

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium">Creative Preview</h3>
      </div>
      
      {/* Preview section */}
      <div className="p-4">
        {/* Thumbnail or creative image */}
        <div className="mb-4">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt="Ad creative" 
              className="max-w-full h-auto rounded-md mx-auto"
              style={{ maxHeight: '200px' }} 
            />
          ) : (
            <div className="bg-gray-200 h-40 rounded-md flex items-center justify-center">
              <p className="text-gray-500">No preview image available</p>
            </div>
          )}
        </div>
        
        {/* Ad Details */}
        <div className="space-y-3 mt-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Headline</h4>
            <p className="mt-1">{headline}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Description</h4>
            <p className="mt-1 text-sm">{description}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Call to Action</h4>
            <p className="mt-1">{callToAction}</p>
          </div>
        </div>
      </div>
      
      {/* Performance metrics summary */}
      <div className="bg-gray-50 px-4 py-4">
        <h4 className="text-sm font-medium text-gray-500 mb-3">Performance Summary</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Impressions</p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('en-US').format(creative.impressions || 0)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Clicks</p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('en-US').format(creative.clicks || 0)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">CTR</p>
            <p className="text-lg font-semibold">
              {((creative.ctr || 0) * 100).toFixed(2)}%
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Spend</p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2
              }).format(creative.spend || 0)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Facebook Ad Link */}
      {creative.previewUrl && (
        <div className="px-4 py-3 bg-gray-100 text-right">
          <a 
            href={creative.previewUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Ad on Facebook
          </a>
        </div>
      )}
    </div>
  );
};

export default CreativePreview;
