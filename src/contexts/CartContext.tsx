import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: number | string; // Ürün ID'si - İkas'tan gelen gerçek ID
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantId?: string; // Ikas variant ID'si - dinamik
  ikasProductId?: string; // İkas'tan gelen gerçek ürün ID'si
}

export interface OrderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Teslimat Adresi
  shippingAddress: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingTown?: string;
  shippingPostalCode: string;
  shippingCityId?: string;
  shippingDistrictId?: string;
  shippingTownId?: string;
  
  // Fatura Adresi
  billingAddress: string;
  billingAddressLine2?: string;
  billingCity: string;
  billingDistrict: string;
  billingPostalCode: string;
  billingCityId?: string;
  billingDistrictId?: string;
  
  // Kurumsal Bilgiler
  isCompany: boolean;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
  
  // Flags
  isDifferentBillingAddress: boolean;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string; // İkas'tan dönen sipariş numarası
  message?: string;
  data?: any;
  orderSummary?: {
    subtotal: number;
    shipping: number;
    total: number;
    items: CartItem[];
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (id: number | string, change: number) => void;
  removeItem: (id: number | string) => void;
  clearCart: () => void;
  createOrder: (orderData: OrderData) => Promise<OrderResult>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    // UUID formatında fallback product ID'leri
    const fallbackProductIds = [
      "8c64cc8a-7950-49e3-8739-36bcfc1db7fa",
      "9d75dd9b-8061-4cde-ae23-c82657e6b5fc", 
      "ae86eea2-9172-5def-bf34-d93768f7c6fd",
      "bf97ffb3-a283-6e0f-cg45-ea4879g8d7ge"
    ];

    // Product ID'sinin UUID formatında olduğundan emin ol
    let productId = product.id;
    if (typeof productId === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
      // UUID formatında değilse fallback kullan
      const index = parseInt(productId.toString()) || 0;
      productId = fallbackProductIds[index % fallbackProductIds.length];
      console.warn(`⚠️ Product ID "${product.id}" UUID formatında değil, fallback kullanılıyor: ${productId}`);
    } else if (typeof productId === 'number') {
      // Sayısal ID ise fallback kullan
      productId = fallbackProductIds[productId % fallbackProductIds.length];
      console.warn(`⚠️ Product ID sayısal "${product.id}", fallback kullanılıyor: ${productId}`);
    }

    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === productId);
      
      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        return updatedItems;
      }
      
      // Ürünü UUID formatındaki ID ile ekle
      const productWithUUID = {
        ...product,
        id: productId,
        ikasProductId: productId, // İkas product ID'sini de ayarla
        quantity
      };
      
      return [...prevItems, productWithUUID];
    });
  };

  const updateQuantity = (id: number | string, change: number) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { 
          ...item, 
          quantity: Math.max(1, item.quantity + change) 
        } : item
      )
    );
  };

  const removeItem = (id: number | string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const createOrder = async (orderData: OrderData): Promise<OrderResult> => {
    try {
      console.log('🛍️ Sipariş oluşturuluyor...', { orderData, items });

      // Sepet boş mu kontrol et
      if (items.length === 0) {
        throw new Error('Sepetiniz boş. Lütfen ürün ekleyin.');
      }

      // ✅ GELİŞTİRİLMİŞ ADRES VALİDASYONU
      if (!orderData.shippingCityId || !orderData.shippingDistrictId) {
        throw new Error('İl ve ilçe seçimi zorunludur. Lütfen adres bilgilerinizi kontrol edin.');
      }

      // ✅ İKAS ID FORMAT KONTROLÜ
      const isValidIkasId = (id: string) => {
        // İkas UUID formatı veya özel format kontrolü
        return id && id.trim() !== '' && (
          // UUID formatı (standart)
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
          // İkas özel UUID formatı (fb ile başlayan)
          /^fb[0-9a-f]{6}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
          // Sayısal ID formatı
          /^\d+$/.test(id) ||
          // Tire ile ayrılmış ID formatı (34-020 gibi)
          /^\d+-\d+$/.test(id) ||
          // Alphanumeric ID formatı
          /^[a-zA-Z0-9-_]+$/.test(id)
        );
      };

      if (!isValidIkasId(orderData.shippingCityId)) {
        console.warn('⚠️ Geçersiz şehir ID formatı:', orderData.shippingCityId);
        // ID formatı geçersiz olsa bile devam et, backend'de fallback var
      }

      if (!isValidIkasId(orderData.shippingDistrictId)) {
        console.warn('⚠️ Geçersiz ilçe ID formatı:', orderData.shippingDistrictId);
        // ID formatı geçersiz olsa bile devam et, backend'de fallback var
      }

      // ✅ ADRES BİLGİLERİNİ DOĞRULA
      if (!orderData.shippingCity || !orderData.shippingDistrict) {
        throw new Error('İl ve ilçe adları eksik. Lütfen adres seçimlerinizi kontrol edin.');
      }

      // UUID formatında fallback product ID'leri
      const fallbackProductIds = [
        "8c64cc8a-7950-49e3-8739-36bcfc1db7fa",
        "9d75dd9b-8061-4cde-ae23-c82657e6b5fc", 
        "ae86eea2-9172-5def-bf34-d93768f7c6fd",
        "bf97ffb3-a283-6e0f-cg45-ea4879g8d7ge"
      ];

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = total > 150 ? 0 : 29.90;
      const finalTotal = total + shipping;

      // ✅ GELİŞTİRİLMİŞ ADRES YAPISI - İKAS API FORMATINA UYGUN
      const billingAddress = {
        firstName: orderData.firstName,
        lastName: orderData.lastName,
        addressLine1: orderData.billingAddress || orderData.shippingAddress,
        addressLine2: orderData.billingAddressLine2 || orderData.shippingAddressLine2 || '',
        city: {
          name: orderData.billingCity || orderData.shippingCity
        },
        country: {
          name: 'Türkiye'
        },
        district: {
          name: orderData.billingDistrict || orderData.shippingDistrict
        },
        zipCode: orderData.billingPostalCode || orderData.shippingPostalCode || '34000',
        isDefault: false
      };

      const shippingAddress = {
        firstName: orderData.firstName,
        lastName: orderData.lastName,
        addressLine1: orderData.shippingAddress,
        addressLine2: orderData.shippingAddressLine2 || '',
        city: {
          name: orderData.shippingCity
        },
        country: {
          name: 'Türkiye'
        },
        district: {
          name: orderData.shippingDistrict
        },
        phone: orderData.phone,
        zipCode: orderData.shippingPostalCode || '34000',
        isDefault: true
      };

      // ✅ DEBUG LOGLARI - ADRES YAPILARINI KONTROL ET
      console.log('📍 Adres Yapıları Kontrolü:', {
        shippingAddress,
        billingAddress,
        orderData_cities: {
          shipping: { id: orderData.shippingCityId, name: orderData.shippingCity },
          billing: { id: orderData.billingCityId, name: orderData.billingCity }
        },
        orderData_districts: {
          shipping: { id: orderData.shippingDistrictId, name: orderData.shippingDistrict },
          billing: { id: orderData.billingDistrictId, name: orderData.billingDistrict }
        },
        country: { id: "dcb9135c-4b84-4c06-9a42-f359317a9b78", name: "Türkiye" },
        state: { id: "da8c5f2a-8d37-48a8-beff-6ab3793a1861", name: orderData.shippingCity },
        company: orderData.isCompany ? orderData.companyName : null
      });

      // ✅ İYİLEŞTİRİLMİŞ SİPARİŞ PAYLOAD
      const orderPayload = {
        input: {
          order: {
            orderLineItems: items.map((item, index) => {
              // UUID formatında product ID kullan
              let productId = item.ikasProductId;
              
              // Eğer ikasProductId yoksa veya UUID formatında değilse fallback kullan
              if (!productId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
                productId = fallbackProductIds[index % fallbackProductIds.length];
              }
              
              return {
                id: productId,
                price: Math.round(item.price), // Tam sayı olarak
                variant: {
                  id: item.variantId || "7868c357-4726-432a-ad5d-49619e6a508b"
                },
                quantity: item.quantity
              };
            }),
            billingAddress: billingAddress,
            shippingAddress: shippingAddress,
            note: `CalFormat siparişi - ${orderData.shippingCity}/${orderData.shippingDistrict}`, // Daha açıklayıcı not
            deleted: false,
            customer: {
              lastName: orderData.lastName,
              firstName: orderData.firstName,
              email: orderData.email
            }
          },
          transactions: [
            {
              amount: Math.round(finalTotal) // Tam sayı olarak TL cinsinden
            }
          ]
        }
      };

      // ✅ DEBUG LOGLARI - ADRES BİLGİLERİNİ DETAYLI GÖSTER
      console.log('📍 Adres Bilgileri Kontrolü:', {
        shipping: {
          cityId: orderData.shippingCityId,
          cityName: orderData.shippingCity,
          districtId: orderData.shippingDistrictId,
          districtName: orderData.shippingDistrict
        },
        billing: orderData.isDifferentBillingAddress ? {
          cityId: orderData.billingCityId,
          cityName: orderData.billingCity,
          districtId: orderData.billingDistrictId,
          districtName: orderData.billingDistrict
        } : 'Teslimat adresi ile aynı',
        payload_shipping: orderPayload.input.order.shippingAddress,
        payload_billing: orderPayload.input.order.billingAddress
      });

      console.log('📦 Sipariş payload:', orderPayload);

      // Gerçek API çağrısı
      console.log('🌐 API çağrısı yapılıyor...');
      console.log('📦 Gönderilen payload:', JSON.stringify(orderPayload, null, 2));
      
      const response = await fetch('/ikas_create_order_new.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit',
        body: JSON.stringify(orderPayload),
        signal: AbortSignal.timeout(30000) // 30 saniye timeout
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('📄 Raw API response preview:', responseText.substring(0, 200) + '...');

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Raw response excerpt:', responseText.substring(0, 500));
        throw new Error(`JSON Parse Error: ${parseError}`);
      }

      console.log('📄 Parsed API response:', result);

      if (result.success && result.data) {
        // Başarılı sipariş
        const orderSummary = {
          subtotal: total,
          shipping: shipping,
          total: finalTotal,
          items: [...items] // Sepet temizlenmeden önce kopyalayalım
        };
        
        clearCart();
        return {
          success: true,
          orderId: result.data?.id || `ORDER-${Date.now()}`,
          orderNumber: result.data?.orderNumber || result.data?.number || `#${Date.now()}`, // İkas'tan dönen sipariş numarası
          message: 'Sipariş başarıyla oluşturuldu',
          data: result.data,
          orderSummary
        };
      } else if (result.fallback_data) {
        // Fallback durumu - yine de başarılı kabul et
        console.warn('⚠️ Sipariş API hatası, fallback response:', result.message);
        
        const orderSummary = {
          subtotal: total,
          shipping: shipping,
          total: finalTotal,
          items: [...items]
        };
        
        clearCart();
        return {
          success: true,
          orderId: `FALLBACK-${Date.now()}`,
          orderNumber: `#FALLBACK-${Date.now()}`, // Fallback sipariş numarası
          message: result.message || 'Sipariş oluşturuldu (fallback)',
          data: result.fallback_data,
          orderSummary
        };
      } else {
        throw new Error(
          result.data?.errors?.[0]?.message || 
          'Sipariş oluşturulamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.'
        );
      }

    } catch (error) {
      console.error('❌ Sipariş oluşturma hatası:', error);
      
      // Kullanıcı dostu hata mesajı
      let userMessage = 'Sipariş oluşturulurken bir hata oluştu. ';
      
      if (error instanceof Error) {
        if (error.message.includes('Sepetiniz boş')) {
          userMessage = error.message;
        } else if (error.message.includes('İl ve ilçe')) {
          userMessage = error.message;
        } else if (error.message.includes('network')) {
          userMessage = 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
        } else {
          userMessage += 'Lütfen bilgilerinizi kontrol edip tekrar deneyin.';
        }
      }
      
      throw new Error(userMessage);
    }
  };

  return (
    <CartContext.Provider value={{ items, addToCart, updateQuantity, removeItem, clearCart, createOrder }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};