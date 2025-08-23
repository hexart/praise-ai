/**
本地存储工具类
封装localStorage操作，提供类型安全的存储功能
*/

/**
从localStorage获取数据
*/
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to get item from storage: ${key}`, error);
    return defaultValue;
  }
}

/**
保存数据到localStorage
*/
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error(`Failed to save item to storage: ${key}`, error);
    return false;
  }
}

/**

从localStorage删除数据
*/
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove item from storage: ${key}`, error);
    return false;
  }
}

/**
检查localStorage中是否存在某个key
*/
export function hasInStorage(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Failed to check item in storage: ${key}`, error);
    return false;
  }
}

/**
清空localStorage中的所有数据
*/
export function clearStorage(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear storage', error);
    return false;
  }
}

/**
获取localStorage的使用情况
*/
export function getStorageInfo(): {
  used: number;
  available: number;
  total: number;
  keys: string[];
} {
  try {
    const keys = Object.keys(localStorage);
    let used = 0;
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        used += key.length + value.length;
      }
    });
    // localStorage通常限制为5-10MB，这里假设5MB
    const total = 5 * 1024 * 1024; // 5MB in bytes
    const available = total - used;
    return {
      used,
      available,
      total,
      keys
    };
  } catch (error) {
    console.error('Failed to get storage info', error);
    return {
      used: 0,
      available: 0,
      total: 0,
      keys: []
    };
  }
}

/**
批量操作localStorage
*/
export function batchStorage<T>(operations: Array<{
  type: 'set' | 'remove';
  key: string;
  value?: T;
}>): boolean {
  try {
    operations.forEach(op => {
      if (op.type === 'set' && op.value !== undefined) {
        saveToStorage(op.key, op.value);
      } else if (op.type === 'remove') {
        removeFromStorage(op.key);
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to perform batch storage operations', error);
    return false;
  }
}

/**
监听storage变化（跨标签页）
*/
export function onStorageChange(
  callback: (key: string, newValue: string | null, oldValue: string | null) => void
): () => void {
  const handler = (event: StorageEvent) => {
    if (event.storageArea === localStorage) {
      callback(event.key || '', event.newValue, event.oldValue);
    }
  };

  window.addEventListener('storage', handler);
  // 返回清理函数
  return () => {
    window.removeEventListener('storage', handler);
  };
}

/**
导出所有localStorage数据
*/
export function exportStorageData(): Record<string, unknown> {
  try {
    const data: Record<string, unknown> = {};
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      } catch {
        // 如果JSON解析失败，保存原始字符串
        data[key] = localStorage.getItem(key);
      }
    });
    return data;
  } catch (error) {
    console.error('Failed to export storage data', error);
    return {};
  }
}

/**
导入localStorage数据
*/
export function importStorageData(data: Record<string, unknown>): boolean {
  try {
    Object.entries(data).forEach(([key, value]) => {
      saveToStorage(key, value);
    });
    return true;
  } catch (error) {
    console.error('Failed to import storage data', error);
    return false;
  }
}