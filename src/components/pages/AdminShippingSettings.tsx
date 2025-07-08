import React, { useState, useEffect } from 'react';
import { Truck, Save, RefreshCw, DollarSign, Target } from 'lucide-react';
import configService, { ShippingConfig } from '../../services/configService';

const AdminShippingSettings: React.FC = () => {
  const [config, setConfig] = useState<ShippingConfig>({
    default_shipping_cost: 29.90,
    free_shipping_threshold: 150.00,
    currency: 'TRY'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadShippingConfig();
  }, []);

  const loadShippingConfig = async () => {
    try {
      setLoading(true);
      // Cache'i temizle
      configService.clearCache();
      const shippingConfig = await configService.getShippingConfig();
      setConfig(shippingConfig);
    } catch (error) {
      console.error('Kargo ayarları yüklenemedi:', error);
      setMessage({ type: 'error', text: 'Kargo ayarları yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const success = await configService.updateShippingConfig({
        default_shipping_cost: config.default_shipping_cost,
        free_shipping_threshold: config.free_shipping_threshold
      });

      if (success) {
        setMessage({ type: 'success', text: 'Kargo ayarları başarıyla kaydedildi!' });
        
        // Güncellenmiş config'i tekrar yükle
        await loadShippingConfig();
        
      } else {
        setMessage({ type: 'error', text: 'Kargo ayarları kaydedilemedi' });
      }
    } catch (error) {
      console.error('Kargo ayarları kaydedilemedi:', error);
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ShippingConfig, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setConfig(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Kargo ayarları yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Kargo Ayarları</h1>
          </div>
          <p className="text-gray-600">
            Kargo ücretlerini ve ücretsiz kargo limitini yönetin
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Kargo Ücreti */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Kargo Ücreti</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Varsayılan Kargo Ücreti (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.default_shipping_cost}
                    onChange={(e) => handleInputChange('default_shipping_cost', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="29.90"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ücretsiz kargo limitinin altındaki siparişlerde uygulanacak kargo ücreti
                  </p>
                </div>
              </div>
            </div>

            {/* Ücretsiz Kargo */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Ücretsiz Kargo</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ücretsiz Kargo Limiti (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.free_shipping_threshold}
                    onChange={(e) => handleInputChange('free_shipping_threshold', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="150.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Bu tutarın üzerindeki siparişlerde kargo ücretsiz olacak
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-4">Önizleme</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">50₺ Sipariş</h5>
                <p className="text-gray-600">
                  Kargo: <span className="font-medium text-orange-600">{config.default_shipping_cost}₺</span>
                </p>
                <p className="text-gray-600">
                  Toplam: <span className="font-medium">{(50 + config.default_shipping_cost).toFixed(2)}₺</span>
                </p>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">100₺ Sipariş</h5>
                <p className="text-gray-600">
                  Kargo: <span className="font-medium text-orange-600">{config.default_shipping_cost}₺</span>
                </p>
                <p className="text-gray-600">
                  Toplam: <span className="font-medium">{(100 + config.default_shipping_cost).toFixed(2)}₺</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {(config.free_shipping_threshold - 100).toFixed(2)}₺ daha → Ücretsiz kargo
                </p>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">{config.free_shipping_threshold}₺+ Sipariş</h5>
                <p className="text-gray-600">
                  Kargo: <span className="font-medium text-green-600">Ücretsiz</span>
                </p>
                <p className="text-gray-600">
                  Toplam: <span className="font-medium">{config.free_shipping_threshold.toFixed(2)}₺</span>
                </p>
                <p className="text-xs text-green-600 mt-1">🎉 Ücretsiz kargo</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={loadShippingConfig}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 inline mr-2" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminShippingSettings;
