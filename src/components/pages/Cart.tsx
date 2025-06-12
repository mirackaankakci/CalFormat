import React from 'react';
import { Trash2, ChevronLeft, ChevronRight, ShoppingBag, CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 150 ? 0 : 29.90;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-yellow-50 min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 text-[#ee7f1a] font-medium hover:text-[#d62d27] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Alışverişe Devam Et
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-10">Sepetim</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <div className="flex justify-center mb-6">
              <ShoppingBag className="w-20 h-20 text-[#ee7f1a] opacity-50" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Sepetiniz Boş</h2>
            <p className="text-gray-600 mb-8">Sepetinizde henüz ürün bulunmamaktadır.</p>
            <Link to="/" className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 inline-block font-medium">
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
                  <h2 className="text-xl font-semibold text-gray-900">Ürünler</h2>
                </div>

                <div className="divide-y divide-orange-100">
                  {items.map(item => (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-yellow-50 p-2">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-medium text-lg text-gray-900">{item.name}</h3>
                        <p className="text-[#ee7f1a] font-semibold mt-2">₺{item.price.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-3 py-1 hover:bg-gray-100 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="w-10 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-3 py-1 hover:bg-gray-100 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2"
                          aria-label="Ürünü kaldır"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden sticky top-24">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
                  <h2 className="text-xl font-semibold text-gray-900">Sipariş Özeti</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Ara Toplam</span>
                    <span>₺{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-700">
                    <span>Kargo</span>
                    <span>{shipping === 0 ? "Ücretsiz" : `₺${shipping.toFixed(2)}`}</span>
                  </div>
                  
                  <div className="border-t border-dashed border-orange-100 pt-4 mt-4">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Toplam</span>
                      <span className="text-[#ee7f1a]">₺{total.toFixed(2)}</span>
                    </div>
                    
                    {shipping > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        ₺{(150 - subtotal).toFixed(2)} daha ekleyin, kargo bedava!
                      </p>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 mt-6 font-medium"
                  >
                    <CreditCard className="w-5 h-5" />
                    Ödemeye Geç
                  </button>
                  
                  <div className="flex flex-col gap-3 mt-8 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#ee7f1a]" />
                      <span>Güvenli ödeme</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;