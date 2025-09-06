import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Zap,
  PenTool,
  Target,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Check,
  X,
  ChevronDown,
  Bot
} from 'lucide-react';
import { getScripts, getUserStyles, getScriptsCount } from '../services/api';
import StyleCopyTool from './StyleCopyTool';
import ScriptHooksGenerator from './ScriptHooksGenerator';

interface Script {
  id: string;
  business_profile_id: string;
  user_id: string;
  style_id?: string;
  title: string;
  content: string;
  script_type: string;
  offer_id?: string;
  campaign_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UserStyle {
  id: string;
  user_id: string;
  language: string;
  style_name?: string; // Optional for backward compatibility with legacy records
  sample_texts?: string[] | string; // Optional for backward compatibility
  style_card: any;
  created_at: string;
  updated_at: string;
}

interface ScriptsProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onScriptsChanged?: () => void;
}

const Scripts: React.FC<ScriptsProps> = ({ 
  businessProfileId, 
  authToken, 
  onTokenRefreshed,
  onScriptsChanged 
}) => {
  const { t } = useTranslation();
  
  // State
  const [scripts, setScripts] = useState<Script[]>([]);
  const [userStyles, setUserStyles] = useState<UserStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScriptType, setSelectedScriptType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'styleCopy' | 'headlineGenerator' | 'scriptWriter'>('styleCopy');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Load data
  const loadData = useCallback(async () => {
    if (!businessProfileId || !authToken) return;
    
    try {
      setIsLoading(true);
      
      // Load scripts and user styles in parallel
      const [scriptsResult, stylesResult] = await Promise.all([
        getScripts(businessProfileId, authToken),
        getUserStyles(authToken)
      ]);
      
      if (scriptsResult.success) {
        setScripts(scriptsResult.data || []);
      }
      
      if (stylesResult.success) {
        setUserStyles(stylesResult.data || []);
      }
    } catch (error) {
      console.error('Error loading scripts data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessProfileId, authToken]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Filter scripts
  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedScriptType === 'all' || script.script_type === selectedScriptType;
    const matchesStatus = selectedStatus === 'all' || script.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // Handle refresh after changes
  const handleDataChange = useCallback(() => {
    loadData();
    if (onScriptsChanged) {
      onScriptsChanged();
    }
  }, [loadData, onScriptsChanged]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('scripts.loading', 'Loading scripts...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="relative mb-8">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg"></div>
          
          <div className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {t('scripts.title', 'AI Writing Assistant')}
                  </h1>
                  <p className="text-gray-600">
                    {t('scripts.subtitle', 'Create content with AI-powered writing tools')}
                  </p>
                </div>
              </div>
            </div>

            {/* Tool Tabs */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setActiveTab('styleCopy')}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'styleCopy'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  {t('scripts.styleCopyTool', 'Style Copy Tool')}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('headlineGenerator')}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'headlineGenerator'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {t('scripts.scriptHooksGenerator', 'Script Hooks Generator')}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('scriptWriter')}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'scriptWriter'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  {t('scripts.scriptWriter', 'Script Writer')}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'styleCopy' && (
          <StyleCopyTool 
            userStyles={userStyles}
            authToken={authToken}
            onStyleCreated={handleDataChange}
            onTokenRefreshed={onTokenRefreshed}
          />
        )}

        {activeTab === 'headlineGenerator' && (
          <ScriptHooksGenerator
            businessProfileId={businessProfileId}
            authToken={authToken}
            onTokenRefreshed={onTokenRefreshed}
          />
        )}

        {activeTab === 'scriptWriter' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <Edit3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('scripts.scriptWriter', 'Script Writer')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('scripts.scriptWriterDesc', 'Coming soon - Create scripts using your analyzed writing style')}
              </p>
            </div>
          </div>
        )}

        {/* Scripts List - Show when we have scripts */}
        {scripts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
            {/* Scripts Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('scripts.yourScripts', 'Your Scripts')} ({filteredScripts.length})
                </h3>
                
                {/* Search and Filters */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('scripts.searchPlaceholder', 'Search scripts...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{t('scripts.filters', 'Filters')}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isFilterOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <div className="p-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('scripts.scriptType', 'Script Type')}
                            </label>
                            <select
                              value={selectedScriptType}
                              onChange={(e) => setSelectedScriptType(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all">{t('scripts.allTypes', 'All Types')}</option>
                              <option value="post">{t('scripts.post', 'Post')}</option>
                              <option value="blog">{t('scripts.blog', 'Blog')}</option>
                              <option value="script">{t('scripts.script', 'Script')}</option>
                              <option value="general">{t('scripts.general', 'General')}</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('scripts.status', 'Status')}
                            </label>
                            <select
                              value={selectedStatus}
                              onChange={(e) => setSelectedStatus(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all">{t('scripts.allStatuses', 'All Statuses')}</option>
                              <option value="draft">{t('scripts.draft', 'Draft')}</option>
                              <option value="published">{t('scripts.published', 'Published')}</option>
                              <option value="archived">{t('scripts.archived', 'Archived')}</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Scripts Grid */}
            <div className="p-6">
              {filteredScripts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm || selectedScriptType !== 'all' || selectedStatus !== 'all'
                      ? t('scripts.noFilterResults', 'No scripts match your current filters')
                      : t('scripts.noScripts', 'No scripts created yet')
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredScripts.map((script) => (
                    <ScriptCard
                      key={script.id}
                      script={script}
                      onEdit={() => {/* TODO: Implement edit */}}
                      onDelete={() => {/* TODO: Implement delete */}}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Script Card component

const ScriptCard: React.FC<{
  script: Script;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ script, onEdit, onDelete }) => {
  const { t } = useTranslation();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-900 line-clamp-1">{script.title}</h4>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title={t('scripts.edit', 'Edit')}
          >
            <Edit3 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title={t('scripts.delete', 'Delete')}
          >
            <Trash2 className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
        {script.content}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(script.status)}`}>
            {t(`scripts.${script.status}`, script.status)}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
            {t(`scripts.${script.script_type}`, script.script_type)}
          </span>
        </div>
        
        <div className="text-xs text-gray-500">
          {new Date(script.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default Scripts;