import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantId?: string; // Ikas variant ID'si için
}

export interface OrderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (id: number, change: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  createOrder: (orderData: OrderData) => Promise<any>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        return updatedItems;
      }
      
      return [...prevItems, { ...product, quantity }];
    });
  };

  const updateQuantity = (id: number, change: number) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { 
          ...item, 
          quantity: Math.max(1, item.quantity + change) 
        } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const createOrder = async (orderData: OrderData): Promise<any> => {
    try {
      const orderLineItems = items.map(item => ({
        id: item.variantId || `variant-${item.id}`, // Gerçek variant ID veya fallback
        price: item.price * 100, // Kuruş cinsinden
        variant: {
          id: item.variantId || `7868c357-4726-432a-ad5d-49619e6a508b` // Fallback variant ID
        },
        quantity: item.quantity
      }));

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = total > 150 ? 0 : 29.90;
      const finalTotal = total + shipping;

      const payload = {
        input: {
          order: {
            orderLineItems,
            billingAddress: {
              addressLine1: orderData.address,
              city: {
                name: orderData.city
              },
              country: {
                name: "Türkiye"
              },
              firstName: orderData.firstName,
              lastName: orderData.lastName,
              isDefault: false
            },
            shippingAddress: {
              city: {
                name: orderData.city
              },
              addressLine1: orderData.address,
              country: {
                name: "Türkiye"
              },
              firstName: orderData.firstName,
              lastName: orderData.lastName,
              phone: orderData.phone,
              isDefault: false,
              state: {
                name: "Türkiye"
              },
              district: {
                name: orderData.district || null
              }
            },
            note: null,
            deleted: false,
            customer: {
              lastName: orderData.lastName,
              firstName: orderData.firstName,
              email: orderData.email
            }
          },
          transactions: [
            {
              amount: Math.round(finalTotal * 100) // Kuruş cinsinden toplam tutar
            }
          ]
        }
      };

      console.log('Sipariş gönderiliyor:', payload);

      // Development mode'da mock yanıt dön (test için)
      if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
        console.log('🔧 Development mode: Mock sipariş oluşturuluyor...');
        
        // 2 saniye simülasyon beklemesi
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockResult = {
          success: true,
          data: {
            createOrder: {
              id: `mock-order-${Date.now()}`,
              status: 'created'
            }
          },
          timestamp: new Date().toISOString()
        };

        console.log('✅ Mock sipariş başarılı:', mockResult);
        
        // Başarılı sipariş sonrası sepeti temizle
        clearCart();
        
        return mockResult;
      }

      // Gerçek API çağrısı
      const possibleUrls = [
        'http://localhost/CallFormat/public/ikas_create_order.php',
        'http://localhost/CalFormat/public/ikas_create_order.php',
        'http://localhost:8080/public/ikas_create_order.php',
        '/public/ikas_create_order.php'
      ];

      let response: Response | null = null;
      let lastError: Error | null = null;

      for (const url of possibleUrls) {
        try {
          console.log(`Trying URL: ${url}`);
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            console.log(`Success with URL: ${url}`);
            break;
          } else {
            console.log(`Failed with URL: ${url}, status: ${response.status}`);
          }
        } catch (error) {
          console.log(`Error with URL: ${url}`, error);
          lastError = error as Error;
          response = null;
        }
      }

      if (!response) {
        throw new Error(`API'ye ulaşılamıyor. PHP server çalışıyor mu? Son hata: ${lastError?.message}`);
      }

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API Result:', result);

      if (!result.success) {
        throw new Error(result.message || 'Sipariş oluşturulamadı');
      }

      // Başarılı sipariş sonrası sepeti temizle
      clearCart();
      
      return result;
    } catch (error) {
      console.error('Sipariş oluşturma hatası:', error);
      throw error;
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