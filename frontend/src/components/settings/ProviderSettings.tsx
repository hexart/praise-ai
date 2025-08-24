import React, { useState, useEffect } from 'react';
import { Server, Sparkles, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw, Cpu } from 'lucide-react';
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

  isLoading?: boolean;
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
  isLoading = false
}) => {
  const logger = createModuleLogger('ProviderSettings');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [modelSwitching, setModelSwitching] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Provider 切换时自动加载模型
  useEffect(() => {
    if (currentProvider && testStatus === 'success') {
      // 延迟加载模型，确保Provider切换完成
      const timer = setTimeout(() => {
        handleLoadModels();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProvider, testStatus]);

  // 处理Provider切换
  const handleProviderSelect = async (providerType: ProviderType) => {
    if (providerType === currentProvider) return;

    const defaultConfigs: Record<ProviderType, ProviderConfig> = {
      ollama: {
        type: 'ollama',
        apiUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:8000',
        defaultModel: import.meta.env.VITE_OLLAMA_DEFAULT_MODEL || 'llama2'
      },
      openai: {
        type: 'openai',
        apiUrl: import.meta.env.VITE_OPENAI_URL || 'https://api.openai.com/v1',
        apiKey: import.meta.env.VITE_OPENAI_KEY || '',
        defaultModel: import.meta.env.VITE_OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo'
      },
      anthropic: {
        type: 'anthropic',
        apiUrl: import.meta.env.VITE_CLAUDE_URL || 'https://api.anthropic.com/v1',
        apiKey: import.meta.env.VITE_CLAUDE_KEY || '',
        defaultModel: import.meta.env.VITE_CLAUDE_DEFAULT_MODEL || 'claude-opus-4-1-20250805'
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
      setTestStatus('success'); // 设置为成功状态，触发useEffect加载模型
      setTestMessage('切换成功！');
      logger.info('Provider切换成功', { provider: providerType });
    } else {
      setTestStatus('error');
      setTestMessage('切换失败，请检查配置');
    }
  };

  // 处理连接测试
  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('正在测试连接...');

    try {
      const success = await onTestConnection();
      if (success) {
        setTestStatus('success');
        setTestMessage('连接测试成功！');
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
    if (modelId === currentModel || modelSwitching) return;

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
    }
  };

  // 处理模型加载
  const handleLoadModels = async () => {
    if (modelsLoading) return;
    
    logger.info('[ProviderSettings] Loading models...');
    setModelsLoading(true);
    try {
      await onLoadModels();
      logger.info('[ProviderSettings] Models loaded successfully');
      
      // 自动选择模型：优先选择默认模型，如果不存在则选择第一个可用模型
      if (models.length > 0 && !currentModel) {
        const defaultModel = currentConfig.defaultModel;
        let targetModel: string | null = null;
        
        // 1. 优先使用配置的默认模型（如果存在）
        if (defaultModel && models.some(m => m.id === defaultModel)) {
          targetModel = defaultModel;
          logger.info('[ProviderSettings] Auto-selecting default model:', defaultModel);
        }
        // 2. 如果默认模型不存在，使用第一个可用模型
        else if (models.length > 0) {
          targetModel = models[0].id;
          logger.info('[ProviderSettings] Auto-selecting first available model:', targetModel);
        }
        
        // 执行模型切换
        if (targetModel) {
          try {
            const success = await onModelSwitch(targetModel);
            if (success) {
              logger.info('自动选择模型成功', { model: targetModel });
            } else {
              logger.warn('自动选择模型失败', { model: targetModel });
            }
          } catch (error) {
            logger.error('自动选择模型时发生错误', { 
              model: targetModel,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
    } catch (error) {
      logger.error('加载模型失败', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setModelsLoading(false);
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
        <div className="grid gap-3">
          {providers.map((provider) => (
            <div
              key={provider.type}
              className={`
                relative p-4 rounded-lg border cursor-pointer transition-all
                ${currentProvider === provider.type
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-200'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
              onClick={() => handleProviderSelect(provider.type)}
            >
              <div className="flex items-start space-x-3">
                <div className={`mt-1 ${currentProvider === provider.type ? 'text-blue-600' : 'text-gray-500'}`}>
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
                    {provider.features.slice(0, 4).map((feature, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-0.5 rounded ${currentProvider === provider.type
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {feature}
                      </span>
                    ))}
                    {provider.features.length > 4 && (
                      <span className="text-xs text-gray-500">
                        +{provider.features.length - 4}项
                      </span>
                    )}
                  </div>
                </div>
                {currentProvider === provider.type && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
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

      {/* 连接测试 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">连接测试</h3>
          <Button
            onClick={handleTestConnection}
            disabled={!isConfigValid() || testStatus === 'testing' || isLoading}
            loading={testStatus === 'testing'}
            variant={testStatus === 'success' ? 'success' : testStatus === 'error' ? 'danger' : 'primary'}
          >
            {testStatus === 'testing' ? '测试中...' : '测试连接'}
          </Button>
        </div>

        {/* 测试结果 */}
        {testMessage && (
          <div className={`p-3 rounded-lg border flex items-center space-x-2 ${
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

        {/* 配置提示 */}
        {!isConfigValid() && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">配置不完整</p>
                <p>请填写所有必需的配置项后再进行连接测试</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 模型管理 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">模型管理</h3>
          <Button
            onClick={handleLoadModels}
            disabled={modelsLoading || !isConfigValid()}
            loading={modelsLoading}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${modelsLoading ? 'animate-spin' : ''}`} />
            {modelsLoading ? '刷新中...' : '刷新模型'}
          </Button>
        </div>

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

        {/* 模型列表 */}
        <div>
          {models.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Cpu className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">暂无可用模型</p>
              <p className="text-xs mt-1">请先测试连接成功后刷新模型列表</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                可用模型 ({models.length})
              </p>
              {models.map((model) => {
                return (
                  <div
                    key={model.id}
                    className={`p-3 rounded-lg border transition-all ${
                      currentModel === model.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
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
                      {currentModel !== model.id && (
                        <Button
                          onClick={() => handleModelSwitch(model.id)}
                          disabled={modelSwitching}
                          variant="secondary"
                          size="sm"
                        >
                          {modelSwitching ? '切换中...' : '选择'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};