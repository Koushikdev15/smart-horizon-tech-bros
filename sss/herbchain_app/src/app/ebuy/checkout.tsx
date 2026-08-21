import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { Colors, Fonts, Spacing } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { PrimaryButton } from '@/components/Buttons';
import { ApiError } from '@/lib/api';
import { razorpayService, type RazorpayOrderDetails } from '@/services/razorpayService';
import { useCartStore } from '@/store/cartStore';

// Non-resolving sentinel host — the WebView never actually needs to reach
// it, onShouldStartLoadWithRequest intercepts navigation to it and reads
// the query params off the URL before the request would even be sent.
const RESULT_HOST = 'https://ayurtrace-checkout-result.local/payment-result';

function buildCheckoutHtml(details: RazorpayOrderDetails, productLabel: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;background:#fcf9ee;">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      var options = {
        key: ${JSON.stringify(details.keyId)},
        amount: ${details.amountPaise},
        currency: ${JSON.stringify(details.currency)},
        order_id: ${JSON.stringify(details.razorpayOrderId)},
        name: 'AyurTrace+',
        description: ${JSON.stringify(productLabel)},
        handler: function (response) {
          window.location = ${JSON.stringify(RESULT_HOST)} +
            '?status=success' +
            '&razorpay_order_id=' + response.razorpay_order_id +
            '&razorpay_payment_id=' + response.razorpay_payment_id +
            '&razorpay_signature=' + response.razorpay_signature;
        },
        modal: {
          ondismiss: function () {
            window.location = ${JSON.stringify(RESULT_HOST)} + '?status=cancelled';
          },
        },
      };
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function () {
        window.location = ${JSON.stringify(RESULT_HOST)} + '?status=failed';
      });
      rzp.open();
    </script>
  </body>
</html>`;
}

type ScreenState = 'loading' | 'ready' | 'verifying' | 'success' | 'cancelled' | 'error';

export default function CheckoutScreen() {
  const router = useRouter();
  const { orderId, amount } = useLocalSearchParams<{ orderId: string; amount: string }>();
  const removeSelected = useCartStore((s) => s.removeSelected);

  const [state, setState] = useState<ScreenState>('loading');
  const [details, setDetails] = useState<RazorpayOrderDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Guards against handling the same result:// redirect twice — onShouldStartLoadWithRequest
  // is the primary interception point, but onNavigationStateChange is wired as a redundant
  // fallback for this specific navigation (some Android WebView versions have been reported
  // to miss onShouldStartLoadWithRequest for a JS-triggered window.location redirect).
  const handledResultRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await razorpayService.createOrder(orderId);
        if (!cancelled) {
          setDetails(result);
          setState('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof ApiError ? err.message : 'Could not start payment. Please try again.');
          setState('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  function processResultUrl(url: string) {
    if (handledResultRef.current) return;
    handledResultRef.current = true;

    const query = new URLSearchParams(url.split('?')[1] ?? '');
    const status = query.get('status');

    if (status === 'success') {
      const razorpay_order_id = query.get('razorpay_order_id') ?? '';
      const razorpay_payment_id = query.get('razorpay_payment_id') ?? '';
      const razorpay_signature = query.get('razorpay_signature') ?? '';
      setState('verifying');
      razorpayService
        .verifyPayment({ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature })
        .then(() => {
          removeSelected();
          setState('success');
        })
        .catch((err) => {
          setErrorMessage(err instanceof ApiError ? err.message : 'Payment could not be verified.');
          setState('error');
        });
    } else if (status === 'cancelled') {
      setState('cancelled');
    } else {
      setErrorMessage('Payment failed.');
      setState('error');
    }
  }

  function handleShouldStartLoad(navState: WebViewNavigation): boolean {
    if (!navState.url.startsWith(RESULT_HOST)) return true;
    processResultUrl(navState.url);
    return false;
  }

  function handleNavigationStateChange(navState: WebViewNavigation) {
    if (navState.url.startsWith(RESULT_HOST)) {
      processResultUrl(navState.url);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader showBack onBackPress={() => router.back()} title="Payment" />

      {state === 'loading' && (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.statusText}>Preparing payment…</Text>
        </View>
      )}

      {state === 'ready' && details && (
        <WebView
          source={{ html: buildCheckoutHtml(details, `AyurTrace+ Order · ₹${amount}`) }}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onNavigationStateChange={handleNavigationStateChange}
          style={{ flex: 1 }}
        />
      )}

      {state === 'verifying' && (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.statusText}>Confirming your payment…</Text>
        </View>
      )}

      {state === 'success' && (
        <View style={styles.centerBox}>
          <Icon name="checkmark-circle" size={48} color={Colors.success} />
          <Text style={styles.statusTitle}>Payment Successful</Text>
          <Text style={styles.statusText}>Your order has been placed and paid for.</Text>
          <PrimaryButton title="Done" onPress={() => router.replace('/(tabs)/ebuy')} style={{ marginTop: Spacing.lg, alignSelf: 'stretch' }} />
        </View>
      )}

      {state === 'cancelled' && (
        <View style={styles.centerBox}>
          <Icon name="close-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.statusTitle}>Payment Cancelled</Text>
          <Text style={styles.statusText}>Your order is saved and awaiting payment — you can retry anytime from your order history.</Text>
          <PrimaryButton title="Close" onPress={() => router.back()} style={{ marginTop: Spacing.lg, alignSelf: 'stretch' }} />
        </View>
      )}

      {state === 'error' && (
        <View style={styles.centerBox}>
          <Icon name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.statusTitle}>Payment Failed</Text>
          <Text style={styles.statusText}>{errorMessage}</Text>
          <PrimaryButton title="Close" onPress={() => router.back()} style={{ marginTop: Spacing.lg, alignSelf: 'stretch' }} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  statusTitle: { fontFamily: Fonts.family.serifSemiBold, fontSize: Fonts.size.lg, color: Colors.primary, marginTop: Spacing.md },
  statusText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 19,
  },
});
