import React, { useState, useEffect } from 'react';
import { Server, Sparkles, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw, Cpu, ChevronDown, Check } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Provider选择 - 保持下拉菜单但现代化设计 */}
      <div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-4">
          选择API提供商
        </h3>
        <div className="relative" data-dropdown>
          <button
            type="button"
            onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-gray-800 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all duration-200 shadow-sm hover:shadow-md"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
                {getProviderIcon(currentProvider)}
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 dark:text-gray-100 text-base">
                  {providers.find(p => p.type === currentProvider)?.name || currentProvider}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {providers.find(p => p.type === currentProvider)?.description}
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${providerDropdownOpen ? 'rotate-180' : ''
                }`}
            />
          </button>

          {/* 下拉菜单内容 - 现代化样式 */}
          {providerDropdownOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white/95 dark:bg-gray-800 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl max-h-96 overflow-y-auto">
              {providers.map((provider) => (
                <button
                  key={provider.type}
                  type="button"
                  onClick={() => handleProviderSelect(provider.type)}
                  className={`w-full flex items-start space-x-4 px-5 py-4 text-left transition-all duration-200 ${currentProvider === provider.type
                      ? 'bg-blue-500/20 hover:bg-blue-500/30'
                      : 'hover:bg-gray-500/10 dark:hover:bg-gray-700/50'
                    } first:rounded-t-2xl last:rounded-b-2xl`}
                >
                  <div className={`p-2.5 rounded-xl mt-0.5 ${currentProvider === provider.type
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                    {getProviderIcon(provider.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100">{provider.name}</span>
                      {currentProvider === provider.type && (
                        <span className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2.5 py-1 rounded-full font-semibold shadow-sm">
                          当前使用
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {provider.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {provider.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className={`text-xs px-3 py-1 rounded-full font-medium ${currentProvider === provider.type
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                          {feature}
                        </span>
                      ))}
                      {provider.features.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                          +{provider.features.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  {currentProvider === provider.type && (
                    <div className="mt-1">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 配置表单 - 现代化卡片设计 */}
      <div className="bg-white dark:bg-gray-800 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-100">
          配置参数
        </h3>
        <div className="space-y-5">
          {/* API地址 - 现代化输入框 */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Server className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
              API地址
            </label>
            <input
              type="text"
              value={currentConfig.apiUrl || ''}
              onChange={(e) => onConfigUpdate({ apiUrl: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-500 dark:focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100"
              placeholder={
                currentProvider === 'ollama'
                  ? 'http://localhost:8000'
                  : 'https://api.openai.com/v1'
              }
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-start">
              <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              {currentProvider === 'ollama'
                ? '本地Ollama服务的API地址（OpenAI兼容格式）'
                : '兼容OpenAI格式的API端点地址，确保以"/v1"结尾'
              }
            </p>
          </div>

          {/* API密钥 (非Ollama) - 现代化密码输入 */}
          {currentProvider !== 'ollama' && (
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Eye className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                API密钥
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={currentConfig.apiKey || ''}
                  onChange={(e) => onConfigUpdate({ apiKey: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-500 dark:focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100 font-mono"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                请确保API密钥安全，不要泄露给他人
              </p>
            </div>
          )}

          {/* 模型选择 - 现代化下拉框 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Sparkles className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                选择模型
              </label>
              <button
                onClick={handleLoadModels}
                disabled={isModelLoading || !isConfigValid()}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-all duration-200 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${isModelLoading ? 'animate-spin' : ''}`} />
                <span>刷新列表</span>
              </button>
            </div>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={handleModelDropdownClick}
                disabled={isModelLoading || !isConfigValid() || isLoading}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`text-sm truncate ${currentModel ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {currentModel
                    ? getModelDisplayName(models.find(m => m.id === currentModel))
                    : `请选择模型 (共 ${models.length} 个可用)`
                  }
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* 模型下拉菜单 - 现代化样式 */}
              {modelDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                  {isModelLoading ? (
                    <div className="px-4 py-8 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">加载模型列表...</span>
                    </div>
                  ) : models.length > 0 ? (
                    <div className="py-2">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => handleModelSwitch(model.id)}
                          disabled={modelSwitching}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${currentModel === model.id
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20'
                              : ''
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100">{model.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {model.family && `${model.family}${model.parameter_size ? ` • ${model.parameter_size}` : ''}`}
                              </div>
                            </div>
                            {currentModel === model.id && (
                              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">暂无可用模型</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">请检查API配置是否正确</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-start">
              <Sparkles className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              选择要使用的AI模型，不同模型有不同的能力和特点
            </p>
          </div>

          {/* 测试连接按钮 - 渐变按钮设计 */}
          <div className="pt-4">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing' || !currentModel || isLoading}
              className={`
              w-full py-3.5 px-6 rounded-xl font-semibold transition-all duration-200 
              flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
              ${testStatus === 'testing'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  : testStatus === 'success'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/25'
                    : testStatus === 'error'
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-red-500/25'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02]'
                }
            `}
            >
              {testStatus === 'testing' ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>测试连接中...</span>
                </>
              ) : testStatus === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>连接成功</span>
                </>
              ) : testStatus === 'error' ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>连接失败</span>
                </>
              ) : (
                <>
                  <Cpu className="w-5 h-5" />
                  <span>测试连接</span>
                </>
              )}
            </button>

            {/* 测试结果提示 - 现代化通知样式 */}
            {testMessage && (
              <div className={`
              mt-3 p-4 rounded-xl text-sm font-medium backdrop-blur-sm
              ${testStatus === 'success'
                  ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : testStatus === 'error'
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }
            `}>
                <div className="flex items-start space-x-2">
                  {testStatus === 'success' ? (
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : testStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin" />
                  )}
                  <span>{testMessage}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};