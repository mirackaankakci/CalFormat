import { useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { siPayService } from '../services/siPayService';

export const useSiPayCallback = () => {
  const { createOrder, clearCart } = useCart();

  useEffect(() => {
    const handleSiPayCallback = async () => {
      // URL'den SiPay callback parametrelerini kontrol et
      const urlParams = new URLSearchParams(window.location.search);
      const sipayStatus = urlParams.get('sipay_status');
      const orderId = urlParams.get('order_id');
      const invoiceId = urlParams.get('invoice_id');

      if (sipayStatus && orderId && invoiceId) {
        console.log('🔄 SiPay 3D callback algılandı:', { sipayStatus, orderId, invoiceId });

        try {
          // Ödeme durumunu kontrol et
          const statusResult = await siPayService.checkPaymentStatus(invoiceId);

          if (statusResult.success && statusResult.data?.payment_status === 1) {
            console.log('✅ SiPay 3D ödeme başarılı, Ikas siparişi oluşturuluyor...');

            // Dummy order data - gerçek checkout verilerini localStorage'dan al
            const orderData = JSON.parse(localStorage.getItem('checkoutData') || '{}');
            
            // Ikas API'sine sipariş oluştur
            const orderResult = await createOrder(orderData);

            if (orderResult.success) {
              console.log('✅ Ikas siparişi başarıyla oluşturuldu:', orderResult.data);
              
              // Sepeti temizle
              clearCart();
              
              // localStorage'ı temizle
              localStorage.removeItem('checkoutData');
              
              // Başarı sayfasına yönlendir
              const successUrl = `/order-success?payment=success&order_id=${orderId}&invoice_id=${invoiceId}&ikas_order_id=${orderResult.orderId}`;
              window.location.href = successUrl;
            } else {
              console.error('❌ Ikas sipariş oluşturma hatası:', orderResult.message);
              
              // Ödeme başarılı ama sipariş oluşturulamadı
              const warningUrl = `/order-success?payment=success&order_id=${orderId}&invoice_id=${invoiceId}&warning=order_creation_failed`;
              window.location.href = warningUrl;
            }
          } else {
            console.error('❌ SiPay 3D ödeme başarısız:', statusResult);
            
            // Ödeme başarısız
            const errorUrl = `/checkout?payment=failed&error=${encodeURIComponent(statusResult.data?.status_description || 'Ödeme başarısız')}`;
            window.location.href = errorUrl;
          }
        } catch (error) {
          console.error('❌ SiPay callback işleme hatası:', error);
          
          const errorUrl = `/checkout?payment=error&error=${encodeURIComponent('Ödeme durumu kontrol edilemedi')}`;
          window.location.href = errorUrl;
        }

        // URL'yi temizle
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleSiPayCallback();
  }, [createOrder, clearCart]);

  return null;
};
