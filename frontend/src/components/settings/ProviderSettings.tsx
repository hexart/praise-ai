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
  onProviderChange: (type: ProviderType, config: ProviderConfig) => Promise<boolean>;
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

  // Provider 切换时不再自动加载模型
  // useEffect(() => {
  //   if (currentProvider && testStatus === 'success') {
  //     const timer = setTimeout(() => {
  //       handleLoadModels();
  //     }, 100);
  //     return () => clearTimeout(timer);
  //   }
  // }, [currentProvider, testStatus]);

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

  // 处理Provider切换 - 移除默认模型配置，不触发任何操作
  const handleProviderSelect = async (providerType: ProviderType) => {
    if (providerType === currentProvider) {
      setProviderDropdownOpen(false);
      return;
    }

    const defaultConfigs: Record<ProviderType, ProviderConfig> = {
      ollama: {
        type: 'ollama',
        apiUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:8000'
      },
      openai: {
        type: 'openai',
        apiUrl: import.meta.env.VITE_OPENAI_URL || 'https://api.openai.com/v1',
        apiKey: import.meta.env.VITE_OPENAI_KEY || ''
      },
      anthropic: {
        type: 'anthropic',
        apiUrl: import.meta.env.VITE_CLAUDE_URL || 'https://api.anthropic.com/v1',
        apiKey: import.meta.env.VITE_CLAUDE_KEY || ''
      },
      gemini: {
        type: 'gemini',
        apiUrl: 'https://generativelanguage.googleapis.com/v1',
        apiKey: ''
      },
      custom: {
        type: 'custom',
        apiUrl: '',
        apiKey: ''
      }
    };

    const newConfig = defaultConfigs[providerType];
    const success = await onProviderChange(providerType, newConfig);

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

  // 处理模型下拉菜单点击 - 只有在配置有效时才允许加载模型
  const handleModelDropdownClick = async () => {
    // 检查配置是否有效
    if (!isConfigValid()) {
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

  // 处理模型加载 - 移除自动选择模型逻辑
  const handleLoadModels = async () => {
    if (isModelLoading) return; // 使用独立的模型加载状态
    
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

  // 检查配置是否有效
  const isConfigValid = () => {
    if (!currentConfig.apiUrl) return false;
    if ((currentProvider === 'openai' || currentProvider === 'anthropic' || currentProvider === 'gemini') && !currentConfig.apiKey) {
      return false;
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">选择API提供商</h3>
        <div className="relative" data-dropdown>
          <button
            type="button"
            onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-3">
              <div className="text-blue-600">
                {getProviderIcon(currentProvider)}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">
                  {providers.find(p => p.type === currentProvider)?.name || currentProvider}
                </div>
                <div className="text-sm text-gray-500">
                  {providers.find(p => p.type === currentProvider)?.description}
                </div>
              </div>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                providerDropdownOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </button>

          {/* 下拉菜单内容 */}
          {providerDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {providers.map((provider) => (
                <button
                  key={provider.type}
                  type="button"
                  onClick={() => handleProviderSelect(provider.type)}
                  className={`w-full flex items-start space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    currentProvider === provider.type ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`mt-1 ${
                    currentProvider === provider.type ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {getProviderIcon(provider.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{provider.name}</span>
                      {currentProvider === provider.type && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {provider.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {provider.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className={`text-xs px-2 py-0.5 rounded ${
                            currentProvider === provider.type
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {feature}
                        </span>
                      ))}
                      {provider.features.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{provider.features.length - 3}项
                        </span>
                      )}
                    </div>
                  </div>
                  {currentProvider === provider.type && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-1">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">配置参数</h3>
        <div className="space-y-4">
          {/* API地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API地址
            </label>
            <input
              type="text"
              value={currentConfig.apiUrl || ''}
              onChange={(e) => onConfigUpdate({ apiUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                currentProvider === 'ollama'
                  ? 'http://localhost:8000'
                  : 'https://api.openai.com/v1'
              }
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {currentProvider === 'ollama'
                ? '本地Ollama服务的API地址（OpenAI兼容格式）'
                : '兼容OpenAI格式的API端点地址'
              }
            </p>
          </div>

          {/* API密钥 (非Ollama) */}
          {currentProvider !== 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API密钥
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={currentConfig.apiKey || ''}
                  onChange={(e) => onConfigUpdate({ apiKey: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk-..."
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                API密钥仅保存在本地浏览器，不会上传到任何服务器
              </p>
            </div>
          )}

        </div>
      </div>

      {/* 连接测试 - 移动到模型选择后显示 */}
      {/* 此部分已被移动到模型管理部分 */}

      {/* 模型管理 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">模型管理</h3>

        {/* 当前模型 */}
        {currentModel && models.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">当前模型:</span>
              <span className="text-sm text-blue-800">
                {getModelDisplayName(models.find(m => m.id === currentModel))}
              </span>
            </div>
          </div>
        )}

        {/* 模型选择 */}
        <div>
          {!isConfigValid() ? (
            <div className="text-center py-6 text-gray-500">
              <Cpu className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">请先配置API地址和密钥</p>
              <p className="text-xs mt-1">配置完成后可点击下拉菜单获取模型列表</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择模型
              </label>
              <div className="relative" data-dropdown>
                <button
                  type="button"
                  onClick={handleModelDropdownClick}
                  className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-lg transition-colors ${
                    currentModel 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  } focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                    !isConfigValid() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isLoading || modelSwitching || isModelLoading || !isConfigValid()}
                >
                  <div className="flex items-center space-x-3">
                    {isModelLoading ? (
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : (
                      <Cpu className={`w-5 h-5 ${
                        currentModel ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    )}
                    <div className="text-left">
                      {isModelLoading ? (
                        <div className="text-blue-600">正在刷新模型...</div>
                      ) : !isConfigValid() ? (
                        <div className="text-gray-500">请先填写API地址和密钥</div>
                      ) : currentModel ? (
                        <>
                          <div className="font-medium text-gray-900">
                            {models.find(m => m.id === currentModel)?.name || currentModel}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getModelDisplayName(models.find(m => m.id === currentModel))}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">请选择模型</div>
                      )}
                    </div>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      modelDropdownOpen ? 'transform rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* 模型下拉菜单内容 */}
                {modelDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {models.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Cpu className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">暂无可用模型</p>
                        <p className="text-xs mt-1">请检查API配置或稍后重试</p>
                      </div>
                    ) : (
                      models.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => handleModelSwitch(model.id)}
                          disabled={modelSwitching}
                          className={`w-full flex items-start space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            currentModel === model.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <Cpu className={`w-5 h-5 mt-0.5 ${
                            currentModel === model.id ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{model.name}</span>
                              {currentModel === model.id && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  使用中
                                </span>
                              )}
                            </div>
                            {model.description && (
                              <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                            )}
                            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                              {model.family && <span>系列: {model.family}</span>}
                              {model.parameter_size && <span>参数: {model.parameter_size}</span>}
                            </div>
                          </div>
                          {currentModel === model.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 模型测试连接按钮 - 只在选中模型后显示 */}
        {currentModel && models.length > 0 && (
          <div className="mt-4">
            <Button
              onClick={handleTestConnection}
              disabled={!isConfigValid() || testStatus === 'testing' || isLoading}
              loading={testStatus === 'testing'}
              variant={testStatus === 'success' ? 'success' : testStatus === 'error' ? 'danger' : 'primary'}
              className="w-full"
            >
              {testStatus === 'testing' ? '测试中...' : '测试连接'}
            </Button>
            
            {/* 测试结果 */}
            {testMessage && (
              <div className={`mt-3 p-3 rounded-lg border flex items-center space-x-2 ${
                testStatus === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : testStatus === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                {testStatus === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                {testStatus === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span className="text-sm">{testMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};