import { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseProvider } from '../providers/BaseProvider';
import { OllamaProvider } from '../providers/OllamaProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import type { ProviderType, ProviderConfig, ModelInfo } from '../types/provider';
import { getFromStorage, saveToStorage } from '../utils/storage';

interface UseProviderReturn {
  // Provider状态
  provider: BaseProvider | null;
  providerType: ProviderType;
  config: ProviderConfig;
  isLoading: boolean;
  error: string | null;
  // 模型管理
  models: ModelInfo[];
  currentModel: string | null;
  // Provider操作
  switchProvider: (type: ProviderType, config: ProviderConfig) => Promise<boolean>;
  updateConfig: (newConfig: Partial<ProviderConfig>) => void;
  // 模型操作
  loadModels: () => Promise<void>;
  switchModel: (modelName: string) => Promise<boolean>;
  // 连接测试
  testConnection: () => Promise<boolean>;
  // 支持的Provider列表
  supportedProviders: Array<{
    type: ProviderType;
    name: string;
    description: string;
    features: string[];
  }>;
}

const STORAGE_KEYS = {
  PROVIDER_TYPE: 'app_provider_type',
  PROVIDER_CONFIG: 'app_provider_config',
  CURRENT_MODEL: 'app_current_model'  // 新增：保存当前模型
};

const SUPPORTED_PROVIDERS = [
  {
    type: 'ollama' as ProviderType,
    name: '本地 Ollama',
    description: '本地部署的开源模型服务（OpenAI 兼容接口）',
    features: ['本地运行', '隐私保护', '免费使用', 'OpenAI 兼容']
  },
  {
    type: 'openai' as ProviderType,
    name: 'OpenAI 兼容 API',
    description: 'OpenAI官方或兼容的API服务',
    features: ['云端服务', '高质量回复', '快速响应']
  }
];

const DEFAULT_CONFIGS: Record<ProviderType, ProviderConfig> = {
  ollama: {
    type: 'ollama',
    apiUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:8000',
    // 新增：为 Ollama 设置默认模型
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
    apiUrl: 'https://api.anthropic.com/v1',
    apiKey: ''
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

/**
 * Provider管理Hook
 * 处理Provider的创建、切换、配置管理等
 */
export function useProvider(): UseProviderReturn {
  // 基础状态
  const [provider, setProvider] = useState<BaseProvider | null>(null);
  const [providerType, setProviderType] = useState<ProviderType>(() =>
    getFromStorage(STORAGE_KEYS.PROVIDER_TYPE, 'ollama' as ProviderType)
  );
  const [config, setConfig] = useState<ProviderConfig>(() => {
    const savedConfig = getFromStorage(STORAGE_KEYS.PROVIDER_CONFIG, null);
    const savedProviderType = getFromStorage(STORAGE_KEYS.PROVIDER_TYPE, 'ollama' as ProviderType);
    const defaultConfig = DEFAULT_CONFIGS[savedProviderType];
    
    if (!defaultConfig) {
      // 如果没有找到默认配置，使用 ollama 作为后备
      return DEFAULT_CONFIGS.ollama;
    }
    
    // 合并保存的配置和默认配置
    if (savedConfig && typeof savedConfig === 'object' && 
        defaultConfig && typeof defaultConfig === 'object') {
      return { ...defaultConfig, ...(savedConfig as ProviderConfig) };
    }
    
    return defaultConfig;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 模型状态
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(() =>
    getFromStorage(STORAGE_KEYS.CURRENT_MODEL, null)
  );

  // 创建Provider实例
  const createProvider = useCallback(async (type: ProviderType, providerConfig: ProviderConfig): Promise<BaseProvider | null> => {
    try {
      setError(null);
      let newProvider: BaseProvider;

      // 确保配置包含默认值
      const defaultConfig = DEFAULT_CONFIGS[type];
      if (!defaultConfig) {
        throw new Error(`No default config for provider type: ${type}`);
      }
      
      const finalConfig = {
        ...defaultConfig,
        ...providerConfig
      };

      switch (type) {
        case 'ollama':
          newProvider = new OllamaProvider(finalConfig);
          break;
        case 'openai':
          if (!finalConfig.apiKey) {
            throw new Error('OpenAI API key is required');
          }
          newProvider = new OpenAIProvider(finalConfig);
          break;
        default:
          throw new Error(`Unsupported provider type: ${type}`);
      }

      // 如果有保存的当前模型，恢复它
      const savedModel = getFromStorage(STORAGE_KEYS.CURRENT_MODEL, null);
      if (savedModel) {
        try {
          await newProvider.switchModel(savedModel);
        } catch (error) {
          console.warn('[useProvider] Failed to restore saved model:', error);
        }
      }

      return newProvider;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create provider';
      setError(errorMessage);
      console.error('[useProvider] Failed to create provider:', err);
      return null;
    }
  }, []);

  // 初始化Provider
  const initializeProvider = useCallback(async () => {
    setIsLoading(true);
    try {
      // 确保配置有效
      const defaultConfig = DEFAULT_CONFIGS[providerType];
      if (!defaultConfig) {
        throw new Error(`Invalid provider type: ${providerType}`);
      }
      
      const finalConfig = {
        ...defaultConfig,
        ...config
      };
      
      const newProvider = await createProvider(providerType, finalConfig);
      setProvider(newProvider);

      if (newProvider) {
        console.log(`[useProvider] Successfully initialized ${providerType} provider`);
        
        // 恢复之前选择的模型
        const savedModel = getFromStorage(STORAGE_KEYS.CURRENT_MODEL, null);
        if (savedModel) {
          setCurrentModel(savedModel);
        }
      }
    } catch (err) {
      console.error('[useProvider] Failed to initialize provider:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerType, config, createProvider]);

  // Provider类型或配置变化时重新初始化
  useEffect(() => {
    initializeProvider();
  }, [initializeProvider]);

  // 切换Provider
  const switchProvider = useCallback(async (type: ProviderType, newConfig: ProviderConfig): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 验证配置
      if (type === 'openai' && !newConfig.apiKey) {
        throw new Error('OpenAI API key is required');
      }

      // 合并默认配置
      const defaultConfig = DEFAULT_CONFIGS[type];
      if (!defaultConfig) {
        throw new Error(`No default config for provider type: ${type}`);
      }
      
      const finalConfig = {
        ...defaultConfig,
        ...newConfig
      };

      // 创建新Provider
      const newProvider = await createProvider(type, finalConfig);
      if (!newProvider) {
        return false;
      }

      // 测试连接
      console.log(`[useProvider] Testing connection for ${type}...`);
      const testResult = await newProvider.testConnection();
      if (!testResult.success) {
        throw new Error(testResult.error || 'Connection test failed');
      }

      // 更新状态和存储
      setProvider(newProvider);
      setProviderType(type);
      setConfig(finalConfig);
      setModels([]);
      setCurrentModel(null);

      saveToStorage(STORAGE_KEYS.PROVIDER_TYPE, type);
      saveToStorage(STORAGE_KEYS.PROVIDER_CONFIG, finalConfig);
      saveToStorage(STORAGE_KEYS.CURRENT_MODEL, null);

      console.log(`[useProvider] Successfully switched to ${type} provider`);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch provider';
      setError(errorMessage);
      console.error('[useProvider] Failed to switch provider:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [createProvider]);

  // 更新配置
  const updateConfig = useCallback((newConfig: Partial<ProviderConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    saveToStorage(STORAGE_KEYS.PROVIDER_CONFIG, updatedConfig);
    
    // 如果Provider已经存在，更新其配置
    if (provider) {
      provider.updateConfig(updatedConfig);
    }
  }, [config, provider]);

  // 加载模型列表
  const loadModels = useCallback(async () => {
    if (!provider) {
      console.warn('[useProvider] No provider available for loading models');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useProvider] Loading models...');
      const result = await provider.listModels();

      if (result.success && result.data) {
        setModels(result.data.models);
        
        // 优先使用：1. 已保存的模型 2. Provider的当前模型 3. 默认模型 4. 第一个可用模型
        const savedModel = getFromStorage(STORAGE_KEYS.CURRENT_MODEL, null);
        const newCurrentModel = 
          (savedModel && result.data.models.some(m => m.id === savedModel)) ? savedModel :
          result.data.currentModel || 
          config.defaultModel ||
          result.data.models[0]?.id || 
          null;
        
        setCurrentModel(newCurrentModel);

        // 确保Provider实例也设置了模型
        if (newCurrentModel && provider) {
          await provider.switchModel(newCurrentModel);
          saveToStorage(STORAGE_KEYS.CURRENT_MODEL, newCurrentModel);
          console.log(`[useProvider] Set provider model to: ${newCurrentModel}`);
        }

        console.log(`[useProvider] Loaded ${result.data.models.length} models, current: ${newCurrentModel}`);
      } else {
        throw new Error(result.error || 'Failed to load models');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load models';
      setError(errorMessage);
      console.error('[useProvider] Failed to load models:', err);
      
      // 如果加载模型失败但有默认模型，尝试使用默认模型
      if (config.defaultModel && provider) {
        console.log(`[useProvider] Falling back to default model: ${config.defaultModel}`);
        setCurrentModel(config.defaultModel);
        await provider.switchModel(config.defaultModel);
        saveToStorage(STORAGE_KEYS.CURRENT_MODEL, config.defaultModel);
      }
    } finally {
      setIsLoading(false);
    }
  }, [provider, config.defaultModel]);

  // 切换模型
  const switchModel = useCallback(async (modelName: string): Promise<boolean> => {
    if (!provider) {
      setError('No provider available');
      return false;
    }

    if (modelName === currentModel) {
      return true; // 已经是当前模型
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await provider.switchModel(modelName);

      if (result.success) {
        setCurrentModel(modelName);
        saveToStorage(STORAGE_KEYS.CURRENT_MODEL, modelName);
        console.log(`[useProvider] Successfully switched to model: ${modelName}`);
        return true;
      } else {
        throw new Error(result.error || 'Failed to switch model');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch model';
      setError(errorMessage);
      console.error('[useProvider] Failed to switch model:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [provider, currentModel]);

  // 测试连接
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!provider) {
      setError('No provider available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await provider.testConnection();

      if (result.success) {
        console.log('[useProvider] Connection test successful:', result.data);
        return true;
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMessage);
      console.error('[useProvider] Connection test failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // Provider初始化完成后自动加载模型
  useEffect(() => {
    if (provider && models.length === 0) {
      loadModels();
    }
  }, [provider, loadModels, models.length]);

  // Memoized值
  const supportedProviders = useMemo(() => SUPPORTED_PROVIDERS, []);

  return {
    // Provider状态
    provider,
    providerType,
    config,
    isLoading,
    error,
    
    // 模型管理
    models,
    currentModel,

    // Provider操作
    switchProvider,
    updateConfig,

    // 模型操作
    loadModels,
    switchModel,

    // 连接测试
    testConnection,

    // 支持的Provider列表
    supportedProviders
  };
}