import React, { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next';
import { Zap, AlertTriangle, Info } from 'lucide-react';
import { getToolCost } from '../services/api';

interface ToolCostBadgeProps {
  toolSlug: string;
  className?: string;
  showTooltip?: boolean;
  userBalance?: number;
  compact?: boolean;
}

const ToolCostBadge: React.FC<ToolCostBadgeProps> = ({ 
  toolSlug, 
  className = '', 
  showTooltip = true,
  userBalance,
  compact = false
}) => {
  // const { t } = useTranslation();
  const [cost, setCost] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const loadCost = async () => {
      try {
        const result = await getToolCost(toolSlug);
        if (result.success && result.data) {
          setCost(result.data.cost);
        } else {
          setCost(0); // Default to free if can't load
        }
      } catch (err) {
        setCost(0); // Default to free on error
      } finally {
        setIsLoading(false);
      }
    };

    loadCost();
  }, [toolSlug]);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center px-2 py-1 bg-gray-100 text-gray-400 text-xs rounded-full ${className}`}>
        <div className="animate-pulse w-4 h-4 bg-gray-300 rounded mr-1"></div>
        <span>...</span>
      </div>
    );
  }

  if (cost === null || cost === 0) {
    return (
      <div className={`inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full ${className}`}>
        <Zap className="h-3 w-3 mr-1" />
        {compact ? 'Free' : 'Free Tool'}
      </div>
    );
  }

  // Check if user has sufficient credits
  const hasSufficientCredits = userBalance === undefined || userBalance >= cost;
  const warningLevel = userBalance !== undefined ? (
    userBalance < cost ? 'insufficient' : 
    userBalance < cost * 2 ? 'low' : 'sufficient'
  ) : 'unknown';

  const getBadgeStyles = () => {
    if (!hasSufficientCredits) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (warningLevel === 'low') {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getIcon = () => {
    if (!hasSufficientCredits) {
      return <AlertTriangle className="h-3 w-3 mr-1" />;
    }
    return <Zap className="h-3 w-3 mr-1" />;
  };

  return (
    <div className="relative inline-block">
      <div
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${getBadgeStyles()} ${className}`}
        onMouseEnter={() => showTooltip && setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        onClick={() => setShowDetails(!showDetails)}
      >
        {getIcon()}
        <span>{cost} credit{cost !== 1 ? 's' : ''}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && showDetails && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            <div className="flex items-center mb-1">
              <Info className="h-3 w-3 mr-1" />
              <span className="font-medium">Tool Cost: {cost} credits</span>
            </div>
            
            {userBalance !== undefined && (
              <div className="text-gray-300">
                Your balance: {userBalance} credits
                {!hasSufficientCredits && (
                  <div className="text-red-300 mt-1">
                    ⚠️ Insufficient credits
                  </div>
                )}
                {warningLevel === 'low' && hasSufficientCredits && (
                  <div className="text-yellow-300 mt-1">
                    ⚠️ Low balance warning
                  </div>
                )}
              </div>
            )}
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCostBadge;