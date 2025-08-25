import React, { useState, useEffect } from 'react';
import { Server, Sparkles, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw, Cpu, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { createModuleLogger } from '../../utils/logger';
import type { ProviderType, ProviderConfig, ModelInfo } from '../../types/provider';

interface ProviderSettingsProps {
  providers: Array<{
    type: ProviderType;
    name: string;
    description: string;
    features: string[];
  }>;
  currentProvider: ProviderType;
  currentConfig: ProviderConfig;
  onProviderChange: (type: ProviderType, config?: ProviderConfig) => Promise<boolean>;
  onConfigUpdate: (config: Partial<ProviderConfig>) => void;
  onTestConnection: () => Promise<boolean>;

  // 模型相关 props
  models?: ModelInfo[];
  currentModel: string | null;
  onModelSwitch: (modelId: string) => Promise<boolean>;
  onLoadModels: () => Promise<void>;
  
  // 新增：连接状态管理
  onSetConnectionStatus?: (connected: boolean, providerType?: ProviderType, modelName?: string) => void;

  isLoading?: boolean; // Provider 初始化加载状态
  isModelLoading?: boolean; // 新增：模型列表加载状态
}

export const ProviderSettings: React.FC<ProviderSettingsProps> = ({
  providers,
  currentProvider,
  currentConfig,
  onProviderChange,
  onConfigUpdate,
  onTestConnection,
  models = [],
  currentModel,
  onModelSwitch,
  onLoadModels,
  onSetConnectionStatus, // 新增
  isLoading = false, // Provider 初始化加载状态
  isModelLoading = false // 新增：模型列表加载状态
}) => {
  const logger = createModuleLogger('ProviderSettings');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [modelSwitching, setModelSwitching] = useState(false);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setProviderDropdownOpen(false);
        setModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理Provider切换 - 实现更智能的配置管理
  const handleProviderSelect = async (providerType: ProviderType) => {
    if (providerType === currentProvider) {
      setProviderDropdownOpen(false);
      return;
    }

    // 不传递具体的配置，让 useProvider hook 根据 Provider 类型自动加载配置
    const success = await onProviderChange(providerType);

    if (success) {
      // 不再设置成功状态，不触发自动加载模型
      setTestStatus('idle');
      setTestMessage('');
      logger.info('Provider切换成功', { provider: providerType });
    } else {
      setTestStatus('error');
      setTestMessage('切换失败，请检查配置');
    }
    
    // 关闭下拉菜单
    setProviderDropdownOpen(false);
  };

  // 处理连接测试
  const handleTestConnection = async () => {
    // 检查是否选择了模型
    if (!currentModel) {
      setTestStatus('error');
      setTestMessage('请先选择一个模型');
      setTimeout(() => {
        setTestStatus('idle');
        setTestMessage('');
      }, 3000);
      return;
    }

    // 检查配置是否有效
    if (!currentConfig.apiUrl) {
      setTestStatus('error');
      setTestMessage('请填写完整的 API 配置（包括 API 地址）');
      setTimeout(() => {
        setTestStatus('idle');
        setTestMessage('');
      }, 3000);
      return;
    }
    
    // 对于需要 API 密钥的 Provider，检查是否已填写
    if ((currentProvider === 'openai' || currentProvider === 'anthropic' || currentProvider === 'gemini') && !currentConfig.apiKey) {
      setTestStatus('error');
      setTestMessage('请填写完整的 API 配置（包括 API 密钥）');
      setTimeout(() => {
        setTestStatus('idle');
        setTestMessage('');
      }, 3000);
      return;
    }

    setTestStatus('testing');
    setTestMessage('正在测试连接...');

    try {
      const success = await onTestConnection();
      if (success) {
        setTestStatus('success');
        setTestMessage('连接测试成功！');
        
        // 设置连接状态
        if (onSetConnectionStatus) {
          onSetConnectionStatus(true, currentProvider, currentModel);
        }
        
        // 连接成功后立即加载模型（由useEffect触发）
      } else {
        setTestStatus('error');
        setTestMessage('连接测试失败，请检查配置');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : '连接测试失败');
    }

    // 3秒后清除状态
    setTimeout(() => {
      if (testStatus !== 'idle') {
        setTestStatus('idle');
        setTestMessage('');
      }
    }, 3000);
  };

  // 处理模型切换
  const handleModelSwitch = async (modelId: string) => {
    if (modelId === currentModel || modelSwitching) {
      setModelDropdownOpen(false);
      return;
    }

    setModelSwitching(true);
    try {
      const success = await onModelSwitch(modelId);
      if (!success) {
        logger.error('模型切换失败');
      }
    } catch (error) {
      logger.error('模型切换失败：', error);
    } finally {
      setModelSwitching(false);
      setModelDropdownOpen(false);
    }
  };

  // 处理模型下拉菜单点击 - 统一处理所有 Provider
  const handleModelDropdownClick = async () => {
    // 检查基本配置是否有效
    if (!currentConfig.apiUrl) {
      return; // 不允许打开下拉菜单
    }

    // 如果下拉菜单即将打开且模型列表为空，则自动刷新
    if (!modelDropdownOpen && models.length === 0) {
      await handleLoadModels();
    }
    // 如果下拉菜单即将打开且模型列表不为空，也刷新以获取最新模型
    else if (!modelDropdownOpen) {
      handleLoadModels(); // 不等待，在后台刷新
    }
    setModelDropdownOpen(!modelDropdownOpen);
  };

  // 处理模型加载 - 在加载前检查配置
  const handleLoadModels = async () => {
    if (isModelLoading) return; // 使用独立的模型加载状态
    
    // 检查配置是否有效
    if (!currentConfig.apiUrl) {
      logger.error('无法加载模型：请先填写 API 地址');
      return;
    }
    
    // 对于需要 API 密钥的 Provider，检查是否已填写
    if ((currentProvider === 'openai' || currentProvider === 'anthropic' || currentProvider === 'gemini') && !currentConfig.apiKey) {
      logger.error('无法加载模型：请先填写 API 密钥');
      return;
    }
    
    logger.info('[ProviderSettings] Loading models...');
    try {
      await onLoadModels();
      logger.info('[ProviderSettings] Models loaded successfully');
    } catch (error) {
      logger.error('加载模型失败', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  // 获取Provider图标
  const getProviderIcon = (type: ProviderType) => {
    switch (type) {
      case 'ollama':
        return <Server className="w-5 h-5" />;
      case 'openai':
      case 'anthropic':
      case 'gemini':
      case 'custom':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Server className="w-5 h-5" />;
    }
  };

  // 检查配置是否有效 - 统一处理所有 Provider
  const isConfigValid = () => {
    if (!currentConfig.apiUrl) return false;
    
    // 对于需要 API 密钥的 Provider，检查是否已填写
    if ((currentProvider === 'openai' || currentProvider === 'anthropic' || currentProvider === 'gemini') && !currentConfig.apiKey) {
      // 允许用户打开下拉菜单，但在获取模型时会提示需要填写 API 密钥
      return true;
    }
    
    return true;
  };

  // 格式化模型显示名称
  const getModelDisplayName = (model: ModelInfo | undefined): string => {
    if (!model) return currentModel || '未知模型';
    
    const parts = [];
    
    // 使用已定义的 ModelInfo 字段
    if (model.family) parts.push(model.family);
    if (model.parameter_size) parts.push(model.parameter_size);
    
    if (parts.length > 0) {
      return `${model.name} (${parts.join(', ')})`;
    }
    return model.name;
  };

  return (
    <div className="space-y-6">
      {/* Provider选择 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">选择API提供商</h3>
        <div className="relative" data-dropdown>
          <button
            type="button"
            onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-800"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-3">
              <div className="text-blue-600 dark:text-blue-400">
                {getProviderIcon(currentProvider)}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {providers.find(p => p.type === currentProvider)?.name || currentProvider}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {providers.find(p => p.type === currentProvider)?.description}
                </div>
              </div>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform dark:text-gray-500 ${
                providerDropdownOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </button>

          {/* 下拉菜单内容 */}
          {providerDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
              {providers.map((provider) => (
                <button
                  key={provider.type}
                  type="button"
                  onClick={() => handleProviderSelect(provider.type)}
                  className={`w-full flex items-start space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    currentProvider === provider.type 
                      ? 'bg-blue-50 dark:bg-blue-900/30 dark:hover:bg-blue-800/50' 
                      : 'dark:hover:bg-gray-700'
                  }`}
                >
                  <div className={`mt-1 ${
                    currentProvider === provider.type ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {getProviderIcon(provider.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{provider.name}</span>
                      {currentProvider === provider.type && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">
                      {provider.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {provider.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className={`text-xs px-2 py-0.5 rounded ${
                            currentProvider === provider.type
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {feature}
                        </span>
                      ))}
                      {provider.features.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{provider.features.length - 3}项
                        </span>
                      )}
                    </div>
                  </div>
                  {currentProvider === provider.type && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-1 dark:bg-blue-500">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 配置表单 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">配置参数</h3>
        <div className="space-y-4">
          {/* API地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              API地址
            </label>
            <input
              type="text"
              value={currentConfig.apiUrl || ''}
              onChange={(e) => onConfigUpdate({ apiUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              placeholder={
                currentProvider === 'ollama'
                  ? 'http://localhost:8000'
                  : 'https://api.openai.com/v1'
              }
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
              {currentProvider === 'ollama'
                ? '本地Ollama服务的API地址（OpenAI兼容格式）'
                : '兼容OpenAI格式的API端点地址'
              }
            </p>
          </div>

          {/* API密钥 (非Ollama) */}
          {currentProvider !== 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                API密钥
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={currentConfig.apiKey || ''}
                  onChange={(e) => onConfigUpdate({ apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 bg-white text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                请确保API密钥安全，不要泄露给他人
              </p>
            </div>
          )}

          {/* 模型选择 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                选择模型
              </label>
              <Button
                onClick={handleLoadModels}
                disabled={isModelLoading || !isConfigValid()}
                variant="ghost"
                size="sm"
                className="text-xs px-2 py-1 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isModelLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={handleModelDropdownClick}
                disabled={isModelLoading || !isConfigValid() || isLoading}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-left dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-800"
              >
                <span className="text-sm text-gray-900 truncate dark:text-gray-100">
                  {currentModel 
                    ? getModelDisplayName(models.find(m => m.id === currentModel))
                    : '请选择模型 (共 0 个可用)'
                  }
                </span>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-400 transition-transform dark:text-gray-500 ${
                    modelDropdownOpen ? 'transform rotate-180' : ''
                  }`} 
                />
              </button>

              {/* 模型下拉菜单 */}
              {modelDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                  {isModelLoading ? (
                    <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>加载模型中...</span>
                      </div>
                    </div>
                  ) : models.length > 0 ? (
                    models.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => handleModelSwitch(model.id)}
                        disabled={modelSwitching}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                          currentModel === model.id 
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-300' 
                            : 'text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {model.family && `${model.family}${model.parameter_size ? `, ${model.parameter_size}` : ''}`}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>暂无可用模型</span>
                      </div>
                      <p className="text-xs mt-1">请检查API配置是否正确</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
              选择要使用的AI模型
            </p>
          </div>

          {/* 测试连接按钮 */}
          <div className="pt-2">
            <Button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing' || !currentModel || isLoading}
              variant="primary"
              className="w-full"
            >
              {testStatus === 'testing' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 mr-2" />
                  测试连接
                </>
              )}
            </Button>

            {/* 测试结果提示 */}
            {testMessage && (
              <div className={`mt-2 p-2 rounded-md text-sm ${
                testStatus === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' 
                  : testStatus === 'error' 
                    ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
              }`}>
                {testMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};